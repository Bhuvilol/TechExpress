import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import {
  userIdParamSchema,
  rejectBodySchema,
  listStudentsQuerySchema,
} from '../validators/admin.schema.js';
import {
  listPending,
  listStudents,
  approve,
  reject,
} from '../controllers/coordinatorVerification.controller.js';

const router = Router();

router.use(requireAuth, requireRole('COORDINATOR'));

router.get('/pending', validate({ query: listStudentsQuerySchema }), ah(listPending));
router.get('/students', validate({ query: listStudentsQuerySchema }), ah(listStudents));

router.post('/students/:id/approve',
  validate({ params: userIdParamSchema }), ah(approve));

router.post('/students/:id/reject',
  validate({ params: userIdParamSchema, body: rejectBodySchema }), ah(reject));

export default router;
