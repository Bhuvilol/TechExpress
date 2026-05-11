import { prisma } from '../config/db.js';
import { Conflict, Forbidden, NotFound, BadRequest } from '../utils/errors.js';
import { membershipService } from './membership.service.js';
import { membershipChangeService } from './membershipChange.service.js';
import { rulesService } from './rules.service.js';

const TEAM_DETAIL_INCLUDE = {
  domain: { select: { id: true, name: true } },
  problemStatement: { select: { id: true, title: true } },
  leader: { select: { id: true, fullName: true, email: true } },
  members: {
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true, fullName: true, email: true, gender: true,
          isDomainExpert: true, profilePicUrl: true,
          domain: { select: { id: true, name: true } },
        },
      },
    },
  },
};

const TEAM_LIST_FIELDS = {
  id: true, name: true, status: true,
  memberCount: true, femaleCount: true, domainExpertCount: true,
  createdAt: true, finalizedAt: true, adminOverride: true,
  domain: { select: { id: true, name: true } },
  problemStatement: { select: { id: true, title: true } },
  leader: { select: { id: true, fullName: true } },
};

const EXPLORE_MEMBER_FIELDS = {
  id: true,
  fullName: true,
  email: true,
  registrationNo: true,
  createdAt: true,
  phone: true,
  discordId: true,
  bio: true,
  preferredDomains: true,
  linkedinUrl: true,
  githubUrl: true,
  portfolioUrl: true,
  resumeDriveLink: true,
  researchPublicationUrl: true,
  certificationsAchievements: true,
  projectInitiative: true,
  participationExperience: true,
  achievements: true,
  hackathonExperience: true,
  gender: true,
  isDomainExpert: true,
  track: true,
  degree: true,
  yearSemester: true,
  contributionAreas: true,
  preferredTeamRole: true,
  technicalSkills: true,
  nonTechnicalSkills: true,
  verificationStatus: true,
  institution: { select: { id: true, name: true } },
  domain: { select: { id: true, name: true } },
  membership: {
    select: {
      teamId: true,
      role: true,
      team: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  },
};

const uniqueIds = (values) => [...new Set(values.filter(Boolean))];

const buildActorDomainSet = (actor) =>
  uniqueIds([actor?.domainId, ...(actor?.preferredDomains ?? [])]);

const scoreMemberMatch = ({ actorDomainIds, actorInstitutionId, member }) => {
  const sharedPreferredDomainIds = (member.preferredDomains ?? []).filter((id) => actorDomainIds.includes(id));
  const primaryDomainMatched = member.domain?.id ? actorDomainIds.includes(member.domain.id) : false;
  const score = [
    primaryDomainMatched ? 3 : 0,
    sharedPreferredDomainIds.length * 2,
    actorInstitutionId && member.institution?.id === actorInstitutionId ? 1 : 0,
  ].reduce((sum, part) => sum + part, 0);

  return { score, sharedPreferredDomainIds, primaryDomainMatched };
};

export const teamService = {
  /**
   * Create a team. The creator becomes its LEADER and first member.
   * Refuses if the user is already in any team (DB-enforced via
   * Team.leaderId @unique AND TeamMember.userId @unique).
   */
  async create({ name, domainId, psId, leaderId }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const leader = await membershipService.loadUserOrThrow(tx, leaderId);
      if (leader.role !== 'STUDENT') throw Forbidden('Only students can create teams');
      if (leader.verificationStatus !== 'VERIFIED') {
        throw Forbidden('Account is not verified');
      }

      const rules = await rulesService.get(tx);
      if (!rules.registrationOpen) throw Forbidden('Team registration is currently closed');

      // Domain & PS sanity checks (cheap, useful errors).
      const domain = await tx.domain.findUnique({ where: { id: domainId } });
      if (!domain) throw BadRequest('Invalid domain');
      if (psId) {
        const ps = await tx.problemStatement.findUnique({
          where: { id: psId },
          select: { id: true, domainId: true },
        });
        if (!ps) throw BadRequest('Invalid problem statement');
        if (ps.domainId !== domainId) {
          throw BadRequest('Problem statement does not belong to chosen domain');
        }
      }

      let team;
      try {
        team = await tx.team.create({
          data: {
            name,
            domainId,
            psId,
            leaderId,
            status: 'FORMING',
            memberCount: 0,
            femaleCount: 0,
            domainExpertCount: 0,
          },
          select: { id: true, name: true, status: true, leaderId: true, domainId: true,
                    memberCount: true, femaleCount: true, domainExpertCount: true },
        });
      } catch (err) {
        if (err.code === 'P2002') {
          const target = String(err.meta?.target ?? '');
          if (target.includes('leaderId')) throw Conflict('You already lead a team');
          throw Conflict('Team name already taken', { field: 'name' });
        }
        throw err;
      }

      await membershipService.addMember(tx, {
        team,
        user: leader,
        role: 'LEADER',
        maxTeamSize: rules.maxTeamSize,
      });

      return tx.team.findUnique({ where: { id: team.id }, include: TEAM_DETAIL_INCLUDE });
    });
  },

  get(idOrName) {
    return prisma.team.findFirst({
      where: { OR: [{ id: idOrName }, { name: idOrName }] },
      include: TEAM_DETAIL_INCLUDE,
    });
  },

  getForUser(userId) {
    return prisma.team.findFirst({
      where: {
        OR: [
          { leaderId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: TEAM_DETAIL_INCLUDE,
    });
  },

  list({ status, domainId, psId, search } = {}) {
    return prisma.team.findMany({
      where: {
        ...(status && { status }),
        ...(domainId && { domainId }),
        ...(psId && { psId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { leader: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
      select: TEAM_LIST_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  },

  // Teams a user could join right now: same PS (if user has one), still
  // FORMING, not full, not finalized. Annotate with what they're missing.
  async listJoinable({ psId } = {}) {
    const rules = await rulesService.get();
    const teams = await prisma.team.findMany({
      where: {
        status: 'FORMING',
        ...(psId && { psId }),
        memberCount: { lt: rules.maxTeamSize },
      },
      select: TEAM_LIST_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
    return teams.map((t) => ({
      ...t,
      missing: rulesService.unmetReasons(t, rules),
    }));
  },

  async listAvailableMembers({ actorId, search, matchActorDomains = false } = {}) {
    const actor = actorId
      ? await prisma.user.findUnique({
          where: { id: actorId },
          select: {
            id: true,
            institutionId: true,
            domainId: true,
            preferredDomains: true,
          },
        })
      : null;

    const actorDomainIds = buildActorDomainSet(actor);
    const filters = [
      { role: 'STUDENT' },
      ...(actorId ? [{ NOT: { id: actorId } }] : []),
      ...(search ? [{
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { registrationNo: { contains: search, mode: 'insensitive' } },
        ],
      }] : []),
      ...(matchActorDomains && actorDomainIds.length ? [{
        OR: [
          { domainId: { in: actorDomainIds } },
          { preferredDomains: { hasSome: actorDomainIds } },
        ],
      }] : []),
    ];

    const users = await prisma.user.findMany({
      where: { AND: filters },
      select: EXPLORE_MEMBER_FIELDS,
      orderBy: { createdAt: 'desc' },
    });

    const allDomainIds = uniqueIds([
      ...users.flatMap((member) => member.preferredDomains ?? []),
      ...users.map((member) => member.domain?.id),
      ...actorDomainIds,
    ]);
    const domains = allDomainIds.length
      ? await prisma.domain.findMany({
          where: { id: { in: allDomainIds } },
          select: { id: true, name: true },
        })
      : [];
    const domainMap = new Map(domains.map((domain) => [domain.id, domain]));

    return users
      .map((member) => {
        const { score, sharedPreferredDomainIds, primaryDomainMatched } = scoreMemberMatch({
          actorDomainIds,
          actorInstitutionId: actor?.institutionId,
          member,
        });
        return {
          ...member,
          preferredDomainDetails: (member.preferredDomains ?? [])
            .map((domainId) => domainMap.get(domainId))
            .filter(Boolean),
          sharedPreferredDomains: sharedPreferredDomainIds
            .map((domainId) => domainMap.get(domainId))
            .filter(Boolean),
          primaryDomainMatched,
          matchScore: score,
        };
      })
      .sort((a, b) => (
        b.matchScore - a.matchScore
        || b.sharedPreferredDomains.length - a.sharedPreferredDomains.length
        || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
  },

  /**
   * Leader-initiated finalization. Refuses if rules unmet (admin override
   * is a separate path). Atomic: re-reads team within tx to avoid TOCTOU.
   */
  async finalize({ teamId, actorId }) {
    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      const team = await membershipService.loadTeamForUpdate(tx, teamId);
      await membershipChangeService.assertNoActiveTeamDisband(tx, teamId);
      if (team.leaderId !== actorId) throw Forbidden('Only the team leader can finalize');
      if (team.status === 'FINALIZED') throw Conflict('Team is already finalized');
      if (team.status === 'DISQUALIFIED') throw Conflict('Team is disqualified');

      const rules = await rulesService.get(tx);
      const unmet = rulesService.unmetReasons(team, rules);
      if (unmet.length) {
        throw Conflict('Team does not meet qualification rules', { unmet });
      }

      // Cancel any still-open invites/requests for this team — finalization
      // closes the door. Use the same cancel-on-full helper logic by
      // running both updateMany calls explicitly (team isn't necessarily
      // at maxSize, just locked).
      await tx.teamInvite.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      });
      await tx.joinRequest.updateMany({
        where: { teamId, status: 'PENDING' },
        data: { status: 'CANCELLED', respondedAt: new Date() },
      });

      return tx.team.update({
        where: { id: teamId },
        data: { status: 'FINALIZED', finalizedAt: new Date() },
        include: TEAM_DETAIL_INCLUDE,
      });
    });
  },

  async disband({ teamId, actorId }) {
    return membershipChangeService.requestDisband({
      teamId,
      leaderId: actorId,
    });
  },

  /**
   * Transfer leadership to an existing team member. Atomic:
   *   - re-read team inside tx (TOCTOU-safe)
   *   - actor must be current leader
   *   - new leader must already be a member of this team
   *   - team must not be FINALIZED / DISQUALIFIED
   *   - flip Team.leaderId, swap MemberRole on both rows
   * Does NOT change qualification — counts and rules are unaffected by
   * which member holds the leader title, so no rules.recompute needed.
   */
  async transferLeadership({ teamId, actorId, newLeaderId }) {
    if (actorId === newLeaderId) throw BadRequest('You are already the leader');

    return prisma.$transaction(async (tx) => {
      await rulesService.assertTeamMutationsAllowed(tx);
      await membershipChangeService.assertNoActiveTeamDisband(tx, teamId);
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: { id: true, leaderId: true, status: true },
      });
      if (!team) throw NotFound('Team not found');
      if (team.leaderId !== actorId) throw Forbidden('Only the current leader can transfer leadership');
      if (team.status === 'FINALIZED') throw Conflict('Team is finalized; leadership cannot change');
      if (team.status === 'DISQUALIFIED') throw Conflict('Team is disqualified');

      const newLeaderMembership = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: newLeaderId } },
        select: { role: true },
      });
      if (!newLeaderMembership) throw BadRequest('New leader must already be a member of this team');

      // Three writes, all in this txn:
      //   1. Demote current leader's TeamMember row to MEMBER
      //   2. Promote new leader's TeamMember row to LEADER
      //   3. Update Team.leaderId
      // Team.leaderId @unique enforces single-leader globally; since both
      // ids belong to this team and the old/new leader swap is symmetric,
      // there's no constraint conflict.
      await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: actorId } },
        data: { role: 'MEMBER' },
      });
      await tx.teamMember.update({
        where: { teamId_userId: { teamId, userId: newLeaderId } },
        data: { role: 'LEADER' },
      });
      await tx.team.update({
        where: { id: teamId },
        data: { leaderId: newLeaderId },
      });

      return tx.team.findUnique({ where: { id: teamId }, include: TEAM_DETAIL_INCLUDE });
    });
  },

  detailInclude: TEAM_DETAIL_INCLUDE,
};
