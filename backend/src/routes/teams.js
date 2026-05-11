import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ah } from '../utils/asyncHandler.js';

import {
  createTeamSchema,
  teamIdParamSchema,
  listTeamsQuerySchema,
  listJoinableQuerySchema,
  listExploreMembersQuerySchema,
  createInviteSchema,
  listTeamInvitesQuerySchema,
  listTeamRequestsQuerySchema,
  leaveSchema,
  dismissSchema,
  transferLeadershipSchema,
} from '../validators/team.schema.js';

import * as team    from '../controllers/team.controller.js';
import * as invite  from '../controllers/invite.controller.js';
import * as join    from '../controllers/joinRequest.controller.js';
import * as change  from '../controllers/membershipChange.controller.js';
import * as evaluation from '../controllers/evaluation.controller.js';

const router = Router();

router.use(requireAuth);

// ── team
router.get('/',          validate({ query: listTeamsQuerySchema }), ah(team.list));
router.get('/mine',      ah(team.mine));
router.get('/joinable',  validate({ query: listJoinableQuerySchema }), ah(team.listJoinable));
router.get('/explore/members', validate({ query: listExploreMembersQuerySchema }), ah(team.listAvailableMembers));

router.post('/',
  requireRole('STUDENT'),
  validate({ body: createTeamSchema }),
  ah(team.create),
);

router.get('/:id',
  validate({ params: teamIdParamSchema }),
  ah(team.get),
);

router.get('/:id/evaluation',
  validate({ params: teamIdParamSchema }),
  ah(team.evaluate),
);

router.get('/:id/scores',
  validate({ params: teamIdParamSchema }),
  ah(evaluation.teamScores),
);

router.post('/:id/finalize',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema }),
  ah(team.finalize),
);

router.delete('/:id',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema }),
  ah(team.disband),
);

router.post('/:id/transfer-leadership',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: transferLeadershipSchema }),
  ah(team.transferLeadership),
);

// ── invites scoped to a team
router.post('/:id/invites',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: createInviteSchema }),
  ah(invite.create),
);
router.get('/:id/invites',
  validate({ params: teamIdParamSchema, query: listTeamInvitesQuerySchema }),
  ah(invite.listForTeam),
);

// ── join requests scoped to a team
router.post('/:id/join-requests',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema }),
  ah(join.create),
);
router.get('/:id/join-requests',
  validate({ params: teamIdParamSchema, query: listTeamRequestsQuerySchema }),
  ah(join.listForTeam),
);

// ── membership changes scoped to a team
router.post('/:id/leave',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: leaveSchema }),
  ah(change.requestLeave),
);
router.post('/:id/dismiss',
  requireRole('STUDENT'),
  validate({ params: teamIdParamSchema, body: dismissSchema }),
  ah(change.requestDismiss),
);

export default router;
