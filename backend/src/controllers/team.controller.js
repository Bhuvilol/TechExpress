import { teamService } from '../services/team.service.js';
import { membershipChangeService } from '../services/membershipChange.service.js';
import { rulesService } from '../services/rules.service.js';
import { auditService } from '../services/audit.service.js';
import { prisma } from '../config/db.js';
import { NotFound } from '../utils/errors.js';

export const create = async (req, res) => {
  const team = await teamService.create({
    name:     req.body.name,
    domainId: req.body.domainId,
    psId:     req.body.psId,
    leaderId: req.user.id,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_CREATED',
    entityType: 'Team', entityId: team.id, details: { name: team.name },
  });
  res.status(201).json({ team });
};

export const get = async (req, res) => {
  const team = await teamService.get(req.params.id);
  if (!team) throw NotFound('Team not found');
  res.json({ team });
};

export const mine = async (req, res) => {
  const team = await teamService.getForUser(req.user.id);
  res.json({ team: team ?? null });
};

export const list = async (req, res) => {
  const teams = await teamService.list(req.query);
  res.json({ count: teams.length, teams });
};

export const listJoinable = async (req, res) => {
  const teams = await teamService.listJoinable(req.query);
  res.json({ count: teams.length, teams });
};

export const listAvailableMembers = async (req, res) => {
  const users = await teamService.listAvailableMembers({
    actorId: req.user.id,
    search: req.query.search,
    matchActorDomains: req.query.matchActorDomains,
  });
  res.json({ count: users.length, users });
};

// Live preview of qualification for a single team. Read-only, no status flip.
export const evaluate = async (req, res) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, status: true, adminOverride: true,
      memberCount: true, femaleCount: true, domainExpertCount: true,
    },
  });
  if (!team) throw NotFound('Team not found');
  const rules = await rulesService.get();
  const { isQualified, issues } = rulesService.evaluateTeam(team, rules);
  res.json({ team, isQualified, issues, rules });
};

export const transferLeadership = async (req, res) => {
  const team = await teamService.transferLeadership({
    teamId:      req.params.id,
    actorId:     req.user.id,
    newLeaderId: req.body.newLeaderId,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: team.id,
    details: { op: 'transferLeadership', from: req.user.id, to: req.body.newLeaderId },
  });
  res.json({ team });
};

export const finalize = async (req, res) => {
  const team = await teamService.finalize({
    teamId:  req.params.id,
    actorId: req.user.id,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FINALIZED',
    entityType: 'Team', entityId: team.id,
  });
  res.json({ team });
};

export const disband = async (req, res) => {
  const result = await membershipChangeService.requestDisband({
    teamId: req.params.id,
    leaderId: req.user.id,
  });
  auditService.record({
    actorId: req.user.id, action: 'TEAM_FORCE_MODIFIED',
    entityType: 'Team', entityId: req.params.id,
    details: { op: result.disbanded ? 'disbandByLeader' : 'requestDisbandByLeader' },
  });
  res.json(result);
};
