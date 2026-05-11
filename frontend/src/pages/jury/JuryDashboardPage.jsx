import { useMemo, useState } from 'react';
import {
  Gavel, Lock, Search, Send, CheckCircle2, Eye,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { roundLabel } from '../../utils/format.js';

// ─────────────────────────────────────────────────────────────────────────
// Open scoring model:
//   - any jury can score any FINALIZED team
//   - DB still enforces ONE score per (team, round) — first jury owns it
//   - the original scorer can edit; others see "Already scored by X"
// ─────────────────────────────────────────────────────────────────────────

const ROUNDS = ['ROUND_1', 'ROUND_2', 'ROUND_3'];
const ROUND_FIELD = { ROUND_1: 'round1State', ROUND_2: 'round2State', ROUND_3: 'round3State' };

const METRICS = [
  { key: 'innovation',   label: 'Innovation & Novelty' },
  { key: 'complexity',   label: 'Technical Complexity' },
  { key: 'presentation', label: 'Presentation & UI/UX' },
  { key: 'impact',       label: 'Impact & Utility' },
  { key: 'feasibility',  label: 'Feasibility & Scalability' },
];

// ── Score chip per team-row, per round ───────────────────────────────────
const RoundChip = ({ round, evalRow, mine, locked, onClick }) => {
  // States: open (no eval), mine (i scored), other (someone else scored), locked
  let label = round.replace('_', ' ');
  let tone = 'dim';
  let detail = locked ? 'Locked' : 'Open';

  if (evalRow) {
    detail = `${evalRow.total}/50 · ${evalRow.jury.fullName.split(' ')[0]}`;
    tone = mine ? 'live' : 'cyan';
  } else if (!locked) {
    tone = 'warn';
  }

  const clickable = !locked && (mine || !evalRow);
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className={`group flex w-full flex-col gap-1 rounded-[4px] border p-3 text-left transition-colors ${
        clickable
          ? 'border-border-dim hover:border-accent-cyan hover:bg-white/[0.03]'
          : 'cursor-not-allowed border-border-dim/60 opacity-70'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{label}</span>
        <Badge tone={tone}>{evalRow ? (mine ? 'Mine' : 'Scored') : (locked ? 'Locked' : 'Open')}</Badge>
      </div>
      <span className={`font-mono text-[12px] ${tone === 'live' ? 'text-status-live' : tone === 'cyan' ? 'text-accent-cyan' : tone === 'warn' ? 'text-status-warn' : 'text-text-dim'}`}>
        {detail}
      </span>
    </button>
  );
};

// ── Score form ───────────────────────────────────────────────────────────
const ScoreSlider = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.15em] text-text-secondary">
      <span>{label}</span>
      <span className="text-accent-cyan">{value} / 10</span>
    </div>
    <input
      type="range"
      min={0} max={10} step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1 w-full cursor-pointer appearance-none rounded bg-bg-void accent-accent-cyan"
    />
  </div>
);

const ScoreModal = ({ open, onClose, team, round, existing, roundUnlocked, onSaved }) => {
  const toast = useToast();
  const [scores, setScores] = useState(() => ({
    innovation:   existing?.innovation   ?? 5,
    complexity:   existing?.complexity   ?? 5,
    presentation: existing?.presentation ?? 5,
    impact:       existing?.impact       ?? 5,
    feasibility:  existing?.feasibility  ?? 5,
  }));
  const [feedback, setFeedback] = useState(existing?.feedback ?? '');
  const [busy, setBusy] = useState(false);

  if (!team || !round) return null;

  const total = METRICS.reduce((s, m) => s + (scores[m.key] ?? 0), 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!roundUnlocked) { toast.warn('Round is not currently open.'); return; }
    setBusy(true);
    try {
      await api.post('/api/jury/evaluations', {
        teamId: team.id,
        round,
        scores,
        feedback: feedback.trim() || undefined,
      });
      toast.success('Score saved.');
      onSaved?.();
      onClose();
    } catch (err) {
      // Most useful message: someone else got there first.
      if (err.code === 'CONFLICT' && err.details?.scoredBy) {
        toast.error(`Already scored by ${err.details.scoredBy}.`);
      } else {
        toast.error(err.message);
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`${roundLabel(round)} · ${team.name}`}>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-[4px] border border-border-dim bg-bg-void p-4">
          <div className="kicker mb-1">{team.domain?.name}</div>
          <div className="font-sans text-[14px] text-text-primary">
            {team.problemStatement?.title ?? 'No problem statement assigned'}
          </div>
        </div>

        {!roundUnlocked && (
          <div className="flex items-center gap-3 rounded-[4px] border border-status-warn/40 bg-status-warn/5 px-4 py-3 font-mono text-[12px] text-status-warn">
            <Lock size={14} /> This round is currently locked. Submissions disabled.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {METRICS.map((m) => (
            <ScoreSlider
              key={m.key}
              label={m.label}
              value={scores[m.key]}
              onChange={(v) => setScores((p) => ({ ...p, [m.key]: v }))}
            />
          ))}
        </div>

        <FormField label="Feedback" hint="Optional. Up to 2000 characters.">
          <textarea
            className="input-glass min-h-[110px]"
            maxLength={2000}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What worked, what could improve."
          />
        </FormField>

        <div className="flex items-center justify-between border-t border-border-dim pt-4">
          <div className="font-mono text-[13px]">
            Total: <span className="text-accent-cyan">{total}</span> <span className="text-text-dim">/ 50</span>
          </div>
          <div className="flex gap-2">
            <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={busy || !roundUnlocked} className="glow-button inline-flex items-center gap-2">
              {busy ? <Spinner size={14} /> : <Send size={14} />}
              {existing ? 'Update score' : 'Submit score'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

// ── Read-only modal for scores owned by another jury ─────────────────────
const ViewModal = ({ open, onClose, team, round, evalRow }) => {
  if (!team || !round || !evalRow) return null;
  return (
    <Modal open={open} onClose={onClose} size="md" title={`${roundLabel(round)} · ${team.name}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-[4px] border border-accent-cyan/40 bg-accent-cyan/5 px-4 py-3 font-mono text-[12px] text-accent-cyan">
          <CheckCircle2 size={14} /> Already scored by {evalRow.jury.fullName}.
        </div>
        <div className="grid grid-cols-2 gap-3 font-mono text-[12px]">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-[4px] border border-border-dim bg-bg-void p-3">
              <div className="text-text-dim">{m.label}</div>
              <div className="text-text-primary">{evalRow[m.key]} / 10</div>
            </div>
          ))}
        </div>
        <div className="rounded-[4px] border border-border-dim bg-bg-void p-3 font-mono text-[13px]">
          Total: <span className="text-accent-cyan">{evalRow.total}</span> / 50
        </div>
        {evalRow.feedback && (
          <div>
            <div className="section-label mb-2">Feedback</div>
            <p className="font-mono text-[12px] leading-relaxed text-text-secondary whitespace-pre-wrap">{evalRow.feedback}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────
export const JuryDashboardPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  // Active modal target: { team, round, evalRow, mine }
  const [active, setActive] = useState(null);

  const board    = useApi(() => api.get('/api/jury/teams'), []);
  const myEvals  = useApi(() => api.get('/api/jury/evaluations'), []);
  const rounds   = useApi(() => api.get('/api/rounds'), []);

  // Index existing evaluations by (teamId, round) for fast lookup. We need
  // the FULL eval row (incl. metric values + feedback) for the edit form,
  // which the board endpoint doesn't include — so merge in myEvals for the
  // ones we own. For others we only have the summary from the board.
  const myDetail = useMemo(() => {
    const map = new Map();
    for (const e of myEvals.data?.evaluations ?? []) {
      map.set(`${e.team.id}:${e.round}`, e);
    }
    return map;
  }, [myEvals.data]);

  const teams = useMemo(() => {
    const list = board.data?.teams ?? [];
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.domain?.name?.toLowerCase().includes(q) ||
      t.problemStatement?.title?.toLowerCase().includes(q),
    );
  }, [board.data, filter]);

  const refresh = () => { board.refetch(); myEvals.refetch(); };

  const openSlot = (team, round, evalRow, mine) => {
    if (mine && evalRow) {
      // Pull full detail from myEvals (board summary is missing metric breakdown).
      const detail = myDetail.get(`${team.id}:${round}`) ?? evalRow;
      setActive({ team, round, evalRow: detail, mine: true });
    } else if (!evalRow) {
      setActive({ team, round, evalRow: null, mine: true }); // mine because we'll own it
    } else {
      // Read-only view for someone else's score.
      setActive({ team, round, evalRow, mine: false, view: true });
    }
  };

  // Stats banner counts.
  const counts = useMemo(() => {
    const all = board.data?.teams ?? [];
    let openSlots = 0, mySlots = 0, otherSlots = 0;
    for (const t of all) {
      const byRound = new Map(t.evaluations.map((e) => [e.round, e]));
      for (const r of ROUNDS) {
        const ev = byRound.get(r);
        if (!ev) openSlots++;
        else if (ev.jury.id === user.id) mySlots++;
        else otherSlots++;
      }
    }
    return { teams: all.length, openSlots, mySlots, otherSlots };
  }, [board.data, user.id]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker="Jury Console"
        title="Score teams"
        description="Open scoring — pick any finalized team and round. First jury to score a round owns it; others can view but not overwrite."
        actions={
          <div className="relative w-full md:w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input className="input-glass !pl-10" placeholder="Filter team / domain / PS…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        }
      />

      {/* Round-state strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ROUNDS.map((r) => {
          const state = rounds.data?.control?.[ROUND_FIELD[r]] ?? '…';
          const tone  = state === 'UNLOCKED' ? 'live' : state === 'CLOSED' ? 'warn' : 'dim';
          return <Badge key={r} tone={tone} dot>{r.replace('_',' ')} · {state}</Badge>;
        })}
        <span className="ml-auto font-mono text-[11px] text-text-dim">
          {counts.teams} teams · {counts.openSlots} open · {counts.mySlots} mine · {counts.otherSlots} taken
        </span>
      </div>

      {board.loading && <CardSkeleton rows={4} />}
      {!board.loading && teams.length === 0 && (
        <Empty
          icon={Gavel}
          title="No finalized teams"
          description="Teams appear here once their leaders finalize. Check back soon."
        />
      )}

      <div className="grid gap-3">
        {teams.map((t) => {
          const byRound = new Map(t.evaluations.map((e) => [e.round, e]));
          return (
            <article key={t.id} className="glass-card flat space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="kicker mb-1">{t.domain?.name}</div>
                  <div className="font-sans text-[15px] font-bold text-text-primary">{t.name}</div>
                  <div className="font-mono text-[12px] text-text-secondary">
                    {t.problemStatement?.title ?? 'No PS assigned'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ROUNDS.map((r) => {
                  const ev = byRound.get(r);
                  const mine = ev?.jury.id === user.id;
                  const locked = rounds.data?.control?.[ROUND_FIELD[r]] !== 'UNLOCKED';
                  return (
                    <RoundChip
                      key={r}
                      round={r}
                      evalRow={ev}
                      mine={mine}
                      locked={locked && !ev}  // a scored slot is still 'viewable' even if locked
                      onClick={() => {
                        if (ev && !mine) {
                          // someone else scored — open read-only view
                          setActive({ team: t, round: r, evalRow: ev, mine: false, view: true });
                        } else {
                          openSlot(t, r, ev, mine);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <ScoreModal
        open={!!active && !active.view}
        team={active?.team}
        round={active?.round}
        existing={active?.evalRow}
        roundUnlocked={active && rounds.data?.control?.[ROUND_FIELD[active.round]] === 'UNLOCKED'}
        onClose={() => setActive(null)}
        onSaved={refresh}
      />
      <ViewModal
        open={!!active && !!active.view}
        team={active?.team}
        round={active?.round}
        evalRow={active?.evalRow}
        onClose={() => setActive(null)}
      />
    </section>
  );
};
