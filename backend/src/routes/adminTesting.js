import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import * as testing from '../controllers/testingImport.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/template.xlsx', ah(testing.downloadTemplate));
router.post('/import', ah(testing.importUsers));
router.post('/results.xlsx', ah(testing.exportResults));

export default router;
