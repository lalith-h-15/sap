import { Router } from 'express';
import crypto from 'node:crypto';
import '../config/env.js'; // makes sure .env is loaded before we read INTEGRATION_API_KEY
import { EmployeeContext } from '../models/EmployeeContext.js';
import { IdentityMapping } from '../models/IdentityMapping.js';
import { HttpError } from '../utils/httpError.js';
import { discoverSkills } from '../services/agents/skillsDiscovery.js';

// ---- 1. Service-to-service authentication (MeritLens -> Career Orchestrator) ----
// A shared secret that only the two backends know. It is never sent to React.
export function requireServiceKey(req, _res, next) {
  const expected = process.env.INTEGRATION_API_KEY || '';
  if (expected.length < 32) {
    return next(new HttpError(503, 'Integration API key is not configured'));
  }
  const [scheme, provided] = String(req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !provided) {
    return next(new HttpError(401, 'Service key required'));
  }
  // Hash both sides so timingSafeEqual always compares equal-length values.
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    return next(new HttpError(401, 'Invalid service key'));
  }
  next();
}

// ---- 2. Build the payload MeritLens will receive (proposed contract) ----
// Only approved evidence references. No name, no email, no match scores or ratings.
export function buildEvidencePackage(context, { mapping = null, now = new Date() } = {}) {
  const skills = discoverSkills(context).map((skill) => ({
    name: skill.name,
    level: skill.level,
    evidenceLevel: skill.evidenceLevel,
    evidenceReference: skill.sourceIds?.[0] ?? null
  }));

  const projectReferences = (context.projects || [])
    .filter((project) => project.verificationStatus === 'verified')
    .map((project) => ({
      evidenceReference: project.evidenceId ?? null,
      title: project.title,
      skills: project.skills || [],
      completedAt: project.completedAt ?? null
    }));

  const learningRecords = (context.learningRecords || []).map((record) => ({
    title: record.title,
    skills: record.skills || [],
    status: record.status ?? null,
    completedAt: record.completedAt ?? null
  }));

  // Identity: explicit IDs only, never matched by name.
  // MeritLens must only trust meritLensEmployeeId when mappingStatus is 'verified'.
  const identity = {
    careerOrchestratorUserId: context.externalEmployeeId,
    canonicalEmployeeId: mapping?.canonicalEmployeeId ?? null,
    meritLensEmployeeId: mapping?.meritLensEmployeeId ?? null,
    mappingStatus: mapping ? mapping.status : 'unmapped'
  };

  return {
    employeeId: context.externalEmployeeId,
    identity,
    source: 'career-orchestrator',
    careerGoal: context.careerGoal ?? null,
    skills,
    learningRecords,
    projectReferences,
    generatedAt: now.toISOString(),
    usageNote: 'Career context for human reviewers. Not a performance rating.'
  };
}

// ---- 3. Lookup by MeritLens employee ID (used by the MeritLens import) ----
// Returns the packet ONLY for a verified mapping. Pending or missing mappings look identical
// (null) so the endpoint cannot be used to probe which employees exist.
export async function packetForMeritLensEmployee(meritLensEmployeeId, models = { IdentityMapping, EmployeeContext }) {
  const mapping = await models.IdentityMapping.findOne({ meritLensEmployeeId, status: 'verified' }).lean();
  if (!mapping) return null;
  const context = await models.EmployeeContext.findOne({ externalEmployeeId: mapping.careerOrchestratorUserId }).lean();
  if (!context) return null;
  return buildEvidencePackage(context, { mapping });
}

// ---- 4. The routes ----
const router = Router();
router.use(requireServiceKey);

router.get('/meritlens/employees/:employeeId/evidence-package', async (req, res, next) => {
  try {
    const context = await EmployeeContext.findOne({ externalEmployeeId: req.params.employeeId }).lean();
    if (!context) throw new HttpError(404, 'Employee context not found');
    const mapping = await IdentityMapping.findOne({ careerOrchestratorUserId: req.params.employeeId }).lean();
    res.json({ success: true, data: buildEvidencePackage(context, { mapping }) });
  } catch (error) {
    next(error);
  }
});

router.get('/meritlens/by-meritlens-id/:meritLensEmployeeId/evidence-package', async (req, res, next) => {
  try {
    const data = await packetForMeritLensEmployee(req.params.meritLensEmployeeId);
    if (!data) throw new HttpError(404, 'No verified mapping found');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
