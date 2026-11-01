import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { buildEvidencePackage, packetForMeritLensEmployee } from '../src/routes/integrationRoutes.js';

const ctx = {
  externalEmployeeId: 'demo-anika-001', name: 'Anika Sharma', careerGoal: 'Junior Full-Stack Developer',
  skills: [{ name: 'React', level: 'intermediate', evidenceLevel: 'self_declared' }],
  assessments: [],
  projects: [
    { title: 'Task App', skills: ['React'], evidenceId: 'PROJECT-REACT-01', verificationStatus: 'verified' },
    { title: 'Draft', skills: ['SQL'], evidenceId: 'P-2', verificationStatus: 'submitted' }
  ],
  learningRecords: [{ title: 'SQL basics', skills: ['SQL'], status: 'completed' }]
};

test('package matches contract and leaks no personal data', () => {
  const pkg = buildEvidencePackage(ctx, { now: new Date('2026-11-01T00:00:00Z') });
  assert.equal(pkg.employeeId, 'demo-anika-001');
  assert.equal(pkg.source, 'career-orchestrator');
  assert.equal(pkg.skills.find((s) => s.name === 'React').evidenceReference, 'PROJECT-REACT-01');
  assert.equal(pkg.projectReferences.length, 1);
  assert.equal(pkg.generatedAt, '2026-11-01T00:00:00.000Z');
  assert.ok(!JSON.stringify(pkg).includes('Anika Sharma'));
});

test('rejects calls without or with wrong service key; fails closed if unset', async () => {
  delete process.env.INTEGRATION_API_KEY;
  let r = await request(app).get('/api/v1/integration/meritlens/employees/x/evidence-package');
  assert.equal(r.status, 503);
  process.env.INTEGRATION_API_KEY = 'k'.repeat(40);
  r = await request(app).get('/api/v1/integration/meritlens/employees/x/evidence-package');
  assert.equal(r.status, 401);
  r = await request(app).get('/api/v1/integration/meritlens/employees/x/evidence-package').set('Authorization', 'Bearer wrong');
  assert.equal(r.status, 401);
});

test('identity block: unmapped by default, mapped when a mapping exists, never uses name', () => {
  let pkg = buildEvidencePackage(ctx);
  assert.deepEqual(pkg.identity, { careerOrchestratorUserId: 'demo-anika-001', canonicalEmployeeId: null, meritLensEmployeeId: null, mappingStatus: 'unmapped' });
  pkg = buildEvidencePackage(ctx, { mapping: { canonicalEmployeeId: 'demo-anika-001', meritLensEmployeeId: 'EMP-1001', status: 'verified' } });
  assert.equal(pkg.identity.meritLensEmployeeId, 'EMP-1001');
  assert.equal(pkg.identity.mappingStatus, 'verified');
  assert.ok(!JSON.stringify(pkg).includes('Anika Sharma'));
});

import { SignJWT } from 'jose';
async function employeeToken() {
  process.env.JWT_SECRET ||= 'x'.repeat(40);
  const { env } = await import('../src/config/env.js');
  return new SignJWT({ role: 'employee' }).setProtectedHeader({ alg: 'HS256' }).setSubject('demo-anika-001')
    .setIssuer(env.jwtIssuer).setAudience(env.jwtAudience).setExpirationTime('5m')
    .sign(new TextEncoder().encode(env.jwtSecret));
}

test('regression: errors in async handlers return JSON, they do not crash the server', async () => {
  const { env } = await import('../src/config/env.js');
  env.jwtSecret = env.jwtSecret || 'x'.repeat(40);
  const token = await employeeToken();
  let r = await request(app).get('/api/v1/orchestrator/employees/someone-else/context').set('Authorization', `Bearer ${token}`);
  assert.equal(r.status, 403);
  assert.match(r.body.message, /only access your own/);
  r = await request(app).post('/api/v1/orchestrator/runs').set('Authorization', `Bearer ${token}`).send({});
  assert.equal(r.status, 400);
});

// ---- lookup by MeritLens ID ----
const ML_ID = '55555555-5555-4555-8555-555555555555';
const fakeModels = (mapping, context) => ({
  IdentityMapping: { findOne: (query) => ({ lean: async () => (mapping && query.meritLensEmployeeId === mapping.meritLensEmployeeId && query.status === mapping.status ? mapping : null) }) },
  EmployeeContext: { findOne: (query) => ({ lean: async () => (context && query.externalEmployeeId === context.externalEmployeeId ? context : null) }) }
});
const verified = { careerOrchestratorUserId: 'demo-anika-001', canonicalEmployeeId: 'demo-anika-001', meritLensEmployeeId: ML_ID, status: 'verified' };

test('lookup by MeritLens ID returns the packet only for a verified mapping', async () => {
  const pkg = await packetForMeritLensEmployee(ML_ID, fakeModels(verified, ctx));
  assert.equal(pkg.employeeId, 'demo-anika-001');
  assert.equal(pkg.identity.meritLensEmployeeId, ML_ID);
  assert.equal(pkg.identity.mappingStatus, 'verified');
  assert.equal(await packetForMeritLensEmployee('unknown-id', fakeModels(verified, ctx)), null);
  assert.equal(await packetForMeritLensEmployee(ML_ID, fakeModels({ ...verified, status: 'pending_verification' }, ctx)), null);
  assert.equal(await packetForMeritLensEmployee(ML_ID, fakeModels(verified, null)), null);
});

test('lookup route needs the service key', async () => {
  process.env.INTEGRATION_API_KEY = 'k'.repeat(40);
  const url = `/api/v1/integration/meritlens/by-meritlens-id/${ML_ID}/evidence-package`;
  assert.equal((await request(app).get(url)).status, 401);
  assert.equal((await request(app).get(url).set('Authorization', 'Bearer wrong')).status, 401);
});
