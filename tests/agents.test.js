import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverSkills } from '../src/services/agents/skillsDiscovery.js';
import { analyseMarket } from '../src/services/agents/marketIntelligence.js';
import { buildLearningPathway } from '../src/services/agents/learningPathways.js';
import { evaluateMatch } from '../src/services/agents/inclusiveMatching.js';
import { assessReadiness } from '../src/services/agents/employerReadiness.js';
import { runBiasAudit } from '../src/services/agents/biasAudit.js';

const context = {
  skills: [{ name: 'React', level: 'intermediate', evidenceLevel: 'self_declared' }, { name: 'JavaScript', level: 'intermediate', evidenceLevel: 'assessed' }],
  assessments: [{ title: 'JS assessment', skills: ['JavaScript'], score: 85, status: 'completed' }],
  projects: [{ title: 'Web app', skills: ['React'], evidenceId: 'P-1', verificationStatus: 'verified' }]
};
const role = { roleId: 'demo-role', title: 'Demo Developer', description: 'Build software', source: 'test', skills: [{ name: 'React', importance: 'essential' }, { name: 'SQL', importance: 'essential' }] };

test('skills discovery upgrades verified project evidence', () => {
  const skills = discoverSkills(context);
  assert.equal(skills.find((item) => item.name === 'React').evidenceLevel, 'demonstrated');
  assert.equal(skills.find((item) => item.name === 'JavaScript').evidenceLevel, 'assessed');
});

test('market analysis identifies missing skills and learning path', () => {
  const skills = discoverSkills(context);
  const market = analyseMarket(role, skills);
  assert.deepEqual(market.skillGaps.map((item) => item.name), ['SQL']);
  assert.equal(buildLearningPathway(market.skillGaps)[0].skill, 'SQL');
});

test('matching and readiness explain evidence coverage', () => {
  const skills = discoverSkills(context);
  const market = analyseMarket(role, skills);
  assert.equal(evaluateMatch(skills, market).score, 50);
  assert.ok(assessReadiness(market, skills).breakdown.length === 2);
});

test('bias audit flags potentially irrelevant criteria', () => {
  const audit = runBiasAudit({ ...role, description: 'Must be under 30 years old' }, { criteriaUsed: ['Relevant skills'] });
  assert.equal(audit.status, 'review_required');
  assert.equal(audit.findings[0].code, 'POTENTIALLY_IRRELEVANT_CRITERION');
});
