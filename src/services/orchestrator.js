import { HttpError } from '../utils/httpError.js';
import { JobRole } from '../models/JobRole.js';
import { OrchestratorRun } from '../models/OrchestratorRun.js';
import { getEmployeeContext } from './integrations/academiaConnect.js';
import { discoverSkills } from './agents/skillsDiscovery.js';
import { analyseMarket } from './agents/marketIntelligence.js';
import { buildLearningPathway } from './agents/learningPathways.js';
import { evaluateMatch } from './agents/inclusiveMatching.js';
import { assessReadiness } from './agents/employerReadiness.js';
import { runBiasAudit } from './agents/biasAudit.js';
import { createHumanReviewSummary } from './agents/humanReview.js';

export async function runOrchestrator({ employeeId, requestedBy, roleId }) {
  const [context, role] = await Promise.all([
    getEmployeeContext(employeeId),
    JobRole.findOne({ roleId, active: true }).lean()
  ]);
  if (!context) throw new HttpError(404, 'Employee context not found. Sync or seed this employee first.');
  if (!role) throw new HttpError(404, 'Job role not found');

  const skills = discoverSkills(context);
  const market = analyseMarket(role, skills);
  const learningPathway = buildLearningPathway(market.skillGaps);
  const matching = evaluateMatch(skills, market);
  const readiness = assessReadiness(market, skills);
  const biasAudit = runBiasAudit(role, matching);
  const result = {
    employee: { id: String(employeeId), name: context.name, careerGoal: context.careerGoal || null },
    generatedAt: new Date().toISOString(),
    agents: {
      skillsDiscovery: { status: 'completed', skills },
      marketIntelligence: { status: 'completed', ...market },
      learningPathway: { status: 'completed', recommendations: learningPathway },
      inclusiveMatching: { status: 'completed', ...matching },
      employerReadiness: { status: 'completed', ...readiness },
      biasAudit: { status: 'completed', ...biasAudit },
      humanInTheLoop: { status: 'awaiting_review', ...createHumanReviewSummary({}) }
    },
    execution: { mode: 'deterministic_rules', aiProviderUsed: false, note: 'These capabilities use transparent rules and curated data; no LLM inference is claimed.' }
  };
  const saved = await OrchestratorRun.create({ employeeId: String(employeeId), requestedBy, roleId, status: 'pending_review', inputSnapshot: { employeeName: context.name, skills, roleTitle: role.title }, result });
  return saved.toObject();
}

export async function reviewRun({ runId, reviewerId, decision, comment }) {
  const run = await OrchestratorRun.findById(runId);
  if (!run) throw new HttpError(404, 'Orchestrator run not found');
  run.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending_review';
  run.humanReview = { decision: decision === 'request_changes' ? 'changes_requested' : decision === 'approve' ? 'approved' : 'rejected', comment, reviewedBy: reviewerId, reviewedAt: new Date() };
  run.result.agents.humanInTheLoop.decision = run.humanReview.decision;
  await run.save();
  return run.toObject();
}
