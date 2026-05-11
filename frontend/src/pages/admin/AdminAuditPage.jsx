import { useMemo, useState } from 'react';
import { History, Search, Download, Filter, UserRound, Database } from 'lucide-react';
import { api } from '../../lib/api.js';
import { storage } from '../../lib/storage.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

const ACTIONS = [
  '',
  'USER_VERIFIED',
  'USER_REJECTED',
  'USER_REVOKED',
  'TEAM_CREATED',
  'TEAM_FINALIZED',
  'TEAM_FORCE_MODIFIED',
  'ROUND_STATE_CHANGED',
  'RULES_UPDATED',
  'BROADCAST_SENT',
  'SCORE_SUBMITTED',
  'REGISTRY_SYNCED',
];

const ACTOR_ROLES = ['', 'ADMIN', 'JURY', 'COORDINATOR', 'STUDENT'];
const LIMITS = [100, 250, 500];

const ACTION_TONE = {
  USER_VERIFIED: 'live',
  USER_REJECTED: 'crit',
  USER_REVOKED: 'crit',
  TEAM_CREATED: 'cyan',
  TEAM_FINALIZED: 'live',
  TEAM_FORCE_MODIFIED: 'warn',
  ROUND_STATE_CHANGED: 'warn',
  RULES_UPDATED: 'warn',
  BROADCAST_SENT: 'cyan',
  SCORE_SUBMITTED: 'cyan',
  REGISTRY_SYNCED: 'cyan',
};

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const AdminAuditPage = () => {
  const toast = useToast();
  const [filters, setFilters] = useState({
    q: '',
    action: '',
    entityType: '',
    entityId: '',
    actorRole: '',
    since: '',
    until: '',
    limit: 250,
  });

  const query = useMemo(() => ({
    q: filters.q || undefined,
    action: filters.action || undefined,
    entityType: filters.entityType || undefined,
    entityId: filters.entityId || undefined,
    actorRole: filters.actorRole || undefined,
    since: filters.since || undefined,
    until: filters.until ? `${filters.until}T23:59:59.999` : undefined,
    limit: filters.limit,
  }), [filters]);

  const { data, loading } = useApi(
    () => api.get('/api/admin/audit-logs', { query }),
    [query],
  );

  const stats = useMemo(() => {
    const entries = data?.entries ?? [];
    return {
      count: entries.length,
      actors: new Set(entries.map((entry) => entry.actor?.id).filter(Boolean)).size,
      actions: new Set(entries.map((entry) => entry.action)).size,
      systemEvents: entries.filter((entry) => !entry.actor).length,
    };
  }, [data]);

  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilters({
      q: '',
      action: '',
      entityType: '',
      entityId: '',
      actorRole: '',
      since: '',
      until: '',
      limit: 250,
    });
  };

  const exportXlsx = async () => {
    const token = storage.getToken();
    try {
      const qs = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));
      const res = await fetch(`${API_BASE}/api/admin/audit-logs/export.xlsx?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Audit log export started.');
    } catch (err) {
      toast.error(err.message ?? 'Export failed.');
    }
  };

  return (
    <>
      <PageHeader
        kicker="History"
        title="Audit Log"
        description="Trace privileged actions with actor context, entity targeting, and operation summaries. Export the current filtered view to Excel when you need an offline trail."
        actions={(
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <button className="ghost-button" onClick={resetFilters}>Reset filters</button>
            <button className="glow-button inline-flex items-center gap-2" onClick={exportXlsx}>
              <Download size={14} /> Export .xlsx
            </button>
          </div>
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={History} label="Visible Entries" value={stats.count} hint="After current filters" />
        <StatTile icon={UserRound} label="Actors" value={stats.actors} hint="Distinct users in result" />
        <StatTile icon={Filter} label="Action Types" value={stats.actions} hint="Distinct action categories" />
        <StatTile icon={Database} label="System Events" value={stats.systemEvents} hint="Rows without an actor" />
      </div>

      <div className="mb-8 grid gap-3 rounded-none border border-white/5 bg-[#050505] p-4 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            className="input-glass !h-11 !pl-10"
            placeholder="Search action, actor, entity, details"
            value={filters.q}
            onChange={(e) => update('q', e.target.value)}
          />
        </div>

        <select className="select-glass !h-11" value={filters.action} onChange={(e) => update('action', e.target.value)}>
          {ACTIONS.map((value) => <option key={value || 'all-actions'} value={value}>{value || 'All actions'}</option>)}
        </select>

        <input
          className="input-glass !h-11"
          placeholder="Entity type"
          value={filters.entityType}
          onChange={(e) => update('entityType', e.target.value)}
        />

        <input
          className="input-glass !h-11"
          placeholder="Entity id"
          value={filters.entityId}
          onChange={(e) => update('entityId', e.target.value)}
        />

        <select className="select-glass !h-11" value={filters.actorRole} onChange={(e) => update('actorRole', e.target.value)}>
          {ACTOR_ROLES.map((value) => <option key={value || 'all-roles'} value={value}>{value || 'All actor roles'}</option>)}
        </select>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Since</span>
          <input className="input-glass !h-11" type="date" value={filters.since} onChange={(e) => update('since', e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Until</span>
          <input className="input-glass !h-11" type="date" value={filters.until} onChange={(e) => update('until', e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Row limit</span>
          <select className="select-glass !h-11" value={filters.limit} onChange={(e) => update('limit', Number(e.target.value))}>
            {LIMITS.map((value) => <option key={value} value={value}>{value} rows</option>)}
          </select>
        </label>
      </div>

      {loading && <CardSkeleton rows={5} />}

      {!loading && data?.entries.length === 0 && (
        <Empty
          icon={History}
          title="No matching audit entries"
          description="Broaden the filters or export a wider time window if you need a larger trail."
        />
      )}

      {data && data.entries.length > 0 && (
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] md:min-w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <Th>Timestamp</Th>
                  <Th>Action</Th>
                  <Th>Summary</Th>
                  <Th>Actor</Th>
                  <Th>Entity</Th>
                  <Th>Details</Th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5 align-top last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-4 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                      <div>{formatDate(entry.createdAt)}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/25">#{entry.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={ACTION_TONE[entry.action] ?? 'dim'}>{titleCase(entry.action)}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[320px] font-mono text-[11px] leading-relaxed text-text-primary">
                        {summarizeEntry(entry)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {entry.actor ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="text-text-primary">{entry.actor.fullName}</div>
                          <div className="text-text-secondary">{entry.actor.email}</div>
                          <div><Badge tone="dim">{titleCase(entry.actor.role)}</Badge></div>
                        </div>
                      ) : (
                        <div className="font-mono text-[11px] text-white/40">System</div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px]">
                      <div className="text-text-primary">{entry.entityType}</div>
                      <div className="mt-1 break-all text-text-secondary">{entry.entityId ?? '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <details className="max-w-[360px]">
                        <summary className="cursor-pointer font-mono text-[11px] text-white/60 hover:text-white">
                          View payload
                        </summary>
                        <pre className="mt-2 overflow-auto rounded-none border border-white/10 bg-white/5 p-3 font-mono text-[10px] leading-relaxed text-white/70">
                          {entry.details ? JSON.stringify(entry.details, null, 2) : 'No details'}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const summarizeEntry = (entry) => {
  const details = entry.details ?? {};

  switch (entry.action) {
    case 'USER_VERIFIED':
      return `Verified ${details.email ?? 'student'}${details.via ? ` via ${titleCase(details.via)}` : ''}.`;
    case 'USER_REJECTED':
      return `Rejected student${details.reason ? ` with reason: ${details.reason}` : ''}${details.via ? ` via ${titleCase(details.via)}` : ''}.`;
    case 'USER_REVOKED':
      return 'Revoked login access for a verified student account.';
    case 'TEAM_CREATED':
      return `Created team "${details.name ?? 'Unnamed'}".`;
    case 'TEAM_FINALIZED':
      return details.override
        ? `Force-finalized team with ${details.unmetAtOverride?.length ?? 0} unmet rule checks.`
        : 'Finalized team after qualification checks passed.';
    case 'TEAM_FORCE_MODIFIED':
      return `Team override operation: ${details.op ?? 'unknown'}${details.status ? ` -> ${details.status}` : ''}${details.userId ? ` (user ${details.userId})` : ''}.`;
    case 'ROUND_STATE_CHANGED':
      return `Changed ${titleCase(details.round)} to ${titleCase(details.state)}.`;
    case 'RULES_UPDATED':
      return details.op === 'recomputeAll'
        ? `Recomputed rule outcomes for ${details.summary?.updated ?? 0} teams.`
        : `Updated rule settings for ${Object.keys(details.patch ?? {}).length} fields.`;
    case 'BROADCAST_SENT':
      return `Broadcast sent with ${details.length ?? 0} characters.`;
    case 'SCORE_SUBMITTED':
      return `Submitted ${titleCase(details.round)} score for team ${details.teamId ?? '-'} with total ${details.total ?? '-'}.`;
    case 'REGISTRY_SYNCED':
      return `Synced ${details.count ?? 0} college registry rows.`;
    default:
      return entry.details ? JSON.stringify(entry.details) : 'No summary available.';
  }
};

const Th = ({ children }) => (
  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{children}</th>
);
