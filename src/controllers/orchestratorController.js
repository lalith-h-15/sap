import { z } from 'zod';
import { EmployeeContext } from '../models/EmployeeContext.js';
import { JobRole } from '../models/JobRole.js';
import { OrchestratorRun } from '../models/OrchestratorRun.js';
import { HttpError } from '../utils/httpError.js';
import { runOrchestrator, reviewRun } from '../services/orchestrator.js';

const contextSchema = z.object({
  name: z.string().min(1).max(120),
  headline: z.string().max(240).optional(),
  careerGoal: z.string().max(240).optional(),
  skills: z.array(z.object({ name: z.string().min(1), level: z.enum(['beginner', 'intermediate', 'advanced']).optional(), evidenceLevel: z.enum(['self_declared', 'assessed', 'demonstrated']).optional(), sourceIds: z.array(z.string()).optional() })).default([]),
  assessments: z.array(z.object({ title: z.string(), skills: z.array(z.string()).default([]), score: z.number().min(0).max(100).optional(), completedAt: z.coerce.date().optional(), status: z.enum(['completed', 'in_progress', 'pending']).optional() })).default([]),
  projects: z.array(z.object({ title: z.string(), description: z.string().optional(), skills: z.array(z.string()).default([]), evidenceId: z.string().optional(), verificationStatus: z.enum(['submitted', 'verified', 'unverified']).optional(), completedAt: z.coerce.date().optional() })).default([]),
  learningRecords: z.array(z.object({ title: z.string(), skills: z.array(z.string()).default([]), status: z.string().optional(), completedAt: z.coerce.date().optional() })).default([])
});

export async function listRoles(_req, res) {
  const roles = await JobRole.find({ active: true }).select('-__v').sort({ title: 1 }).lean();
  res.json({ success: true, count: roles.length, data: roles });
}

export async function getMyContext(req, res) {
  const context = await EmployeeContext.findOne({ externalEmployeeId: req.user.id }).lean();
  if (!context) throw new HttpError(404, 'No local employee context found. Use PUT /api/v1/employees/me/context to sync profile data.');
  res.json({ success: true, data: context });
}

export async function getEmployeeContextById(req, res) {
  const targetId = req.params.employeeId;
  const isSelf = targetId === req.user.id;
  const isManager = ['manager', 'admin', 'industry'].includes(String(req.user.role).toLowerCase());
  if (!isSelf && !isManager) throw new HttpError(403, 'You can only access your own employee context');
  const context = await EmployeeContext.findOne({ externalEmployeeId: targetId }).lean();
  if (!context) throw new HttpError(404, 'Employee context not found');
  res.json({ success: true, data: context });
}

export async function upsertMyContext(req, res) {
  const data = contextSchema.parse(req.body);
  const context = await EmployeeContext.findOneAndUpdate(
    { externalEmployeeId: req.user.id },
    { $set: { ...data, externalEmployeeId: req.user.id, source: 'academiaconnect', updatedBy: req.user.id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  res.status(200).json({ success: true, message: 'Employee context synchronised', data: context });
}

export async function executeOrchestrator(req, res) {
  const body = z.object({ roleId: z.string().min(1) }).parse(req.body);
  const result = await runOrchestrator({ employeeId: req.user.id, requestedBy: req.user.id, roleId: body.roleId });
  res.status(201).json({ success: true, message: 'Career Orchestrator run completed', data: result });
}

export async function getRun(req, res) {
  const run = await OrchestratorRun.findById(req.params.runId).lean();
  if (!run) throw new HttpError(404, 'Run not found');
  const isOwner = run.employeeId === req.user.id || run.requestedBy === req.user.id;
  const isManager = ['manager', 'admin', 'industry'].includes(String(req.user.role).toLowerCase());
  if (!isOwner && !isManager) throw new HttpError(403, 'You cannot access this run');
  res.json({ success: true, data: run });
}

export async function reviewOrchestratorRun(req, res) {
  const body = z.object({ decision: z.enum(['approve', 'reject', 'request_changes']), comment: z.string().max(2000).optional() }).parse(req.body);
  const result = await reviewRun({ runId: req.params.runId, reviewerId: req.user.id, ...body });
  res.json({ success: true, message: 'Human review recorded', data: result });
}
