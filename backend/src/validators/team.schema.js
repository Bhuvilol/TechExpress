import { z } from 'zod';

const cuid = z.string().cuid();

// team
export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(60),
  domainId: cuid,
  psId: cuid.optional(),
});

export const teamIdParamSchema = z.object({ id: cuid });

export const listTeamsQuerySchema = z.object({
  status: z.enum(['FORMING', 'QUALIFIED', 'FINALIZED', 'DISQUALIFIED']).optional(),
  domainId: cuid.optional(),
  psId: cuid.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const listJoinableQuerySchema = z.object({
  psId: cuid.optional(),
});

export const listExploreMembersQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  matchActorDomains: z.coerce.boolean().optional(),
});

// invite
export const createInviteSchema = z.object({
  inviteeId: cuid,
});

export const inviteIdParamSchema = z.object({ inviteId: cuid });

export const listTeamInvitesQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED']).optional(),
});

// join request
export const requestIdParamSchema = z.object({ requestId: cuid });

export const listTeamRequestsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'DENIED', 'CANCELLED']).optional(),
});

// membership change
export const leaveSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const dismissSchema = z.object({
  targetUserId: cuid,
  reason: z.string().trim().max(500).optional(),
});

export const changeIdParamSchema = z.object({ changeId: cuid });

// transfer leadership
export const transferLeadershipSchema = z.object({
  newLeaderId: cuid,
});

// admin override
export const forceAddSchema = z.object({
  userId: cuid,
  role: z.enum(['LEADER', 'MEMBER']).optional(),
});

export const forceRemoveSchema = z.object({
  userId: cuid,
});

export const setStatusSchema = z.object({
  status: z.enum(['FORMING', 'QUALIFIED', 'FINALIZED', 'DISQUALIFIED']),
});
