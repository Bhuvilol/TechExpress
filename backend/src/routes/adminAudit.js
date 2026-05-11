import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';
import { listAuditQuerySchema } from '../validators/broadcast.schema.js';
import * as audit from '../controllers/audit.controller.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/',
  validate({ query: listAuditQuerySchema }),
  ah(audit.list),
);

router.get('/export.xlsx',
  validate({ query: listAuditQuerySchema }),
  ah(audit.exportXlsx),
);

export default router;
