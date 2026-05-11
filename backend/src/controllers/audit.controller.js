import { auditService } from '../services/audit.service.js';
import XLSX from 'xlsx';

export const list = async (req, res) => {
  const entries = await auditService.list(req.query);
  res.json({ count: entries.length, entries });
};

const summarizeDetails = (entry) => {
  const details = entry.details ?? {};

  switch (entry.action) {
    case 'USER_VERIFIED':
      return `Verified ${details.email ?? 'user'}${details.via ? ` via ${details.via}` : ''}`;
    case 'USER_REJECTED':
      return `Rejected user${details.reason ? `: ${details.reason}` : ''}${details.via ? ` via ${details.via}` : ''}`;
    case 'USER_REVOKED':
      return 'Revoked user access';
    case 'TEAM_CREATED':
      return `Created team ${details.name ?? ''}`.trim();
    case 'TEAM_FINALIZED':
      return details.override ? 'Force-finalized team' : 'Finalized team';
    case 'TEAM_FORCE_MODIFIED':
      return details.op ? `Team override: ${details.op}` : 'Team override';
    case 'ROUND_STATE_CHANGED':
      return `${details.round ?? 'Round'} -> ${details.state ?? 'updated'}`;
    case 'RULES_UPDATED':
      return details.op === 'recomputeAll'
        ? `Recomputed all teams (${details.summary?.updated ?? 0} updated)`
        : `Updated ${Object.keys(details.patch ?? {}).length} rule fields`;
    case 'BROADCAST_SENT':
      return `Broadcast sent (${details.length ?? 0} chars)`;
    case 'SCORE_SUBMITTED':
      return `Submitted ${details.round ?? 'round'} score (${details.total ?? '-'})`;
    case 'REGISTRY_SYNCED':
      return `Synced ${details.count ?? 0} registry rows`;
    default:
      return entry.details ? JSON.stringify(entry.details) : '';
  }
};

export const exportXlsx = async (req, res) => {
  const entries = await auditService.exportRows(req.query);

  const rows = entries.map((entry) => ({
    Timestamp: entry.createdAt.toISOString(),
    Action: entry.action,
    Summary: summarizeDetails(entry),
    EntityType: entry.entityType,
    EntityId: entry.entityId ?? '',
    ActorName: entry.actor?.fullName ?? 'System',
    ActorEmail: entry.actor?.email ?? '',
    ActorRole: entry.actor?.role ?? 'SYSTEM',
    DetailsJson: entry.details ? JSON.stringify(entry.details) : '',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buffer);
};
