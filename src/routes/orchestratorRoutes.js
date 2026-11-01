import { Router } from 'express';
import { requireAuth, requireManager } from '../middleware/auth.js';
import {
  listRoles, getMyContext, getEmployeeContextById, upsertMyContext,
  executeOrchestrator, getRun, reviewOrchestratorRun
} from '../controllers/orchestratorController.js';

const router = Router();
router.use(requireAuth);
router.get('/roles', listRoles);
router.get('/employees/me/context', getMyContext);
router.put('/employees/me/context', upsertMyContext);
router.get('/employees/:employeeId/context', getEmployeeContextById);
router.post('/runs', executeOrchestrator);
router.get('/runs/:runId', getRun);
router.post('/runs/:runId/review', requireManager, reviewOrchestratorRun);
export default router;
