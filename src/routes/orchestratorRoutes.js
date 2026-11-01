import { Router } from 'express';
import { requireAuth, requireManager } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  listRoles, getMyContext, getEmployeeContextById, upsertMyContext,
  executeOrchestrator, getRun, reviewOrchestratorRun
} from '../controllers/orchestratorController.js';

const router = Router();
router.use(requireAuth);
router.get('/roles', asyncHandler(listRoles));
router.get('/employees/me/context', asyncHandler(getMyContext));
router.put('/employees/me/context', asyncHandler(upsertMyContext));
router.get('/employees/:employeeId/context', asyncHandler(getEmployeeContextById));
router.post('/runs', asyncHandler(executeOrchestrator));
router.get('/runs/:runId', asyncHandler(getRun));
router.post('/runs/:runId/review', requireManager, asyncHandler(reviewOrchestratorRun));
export default router;
