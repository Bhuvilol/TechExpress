import { useMemo, useState } from 'react';
import {
  ShieldCheck, Search, KeyRound, Users, ShieldAlert, ShieldOff, Clock, Eye, Copy,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';
import { titleCase } from '../../utils/format.js';

const STATUS_TONE = { PENDING: 'warn', VERIFIED: 'live', REJECTED: 'crit', REVOKED: 'crit' };

export const AdminVerificationPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [reject, setReject] = useState(null);
  // { user, password } shown after approve / reissue
  const [credential, setCredential] = useState(null);

  const pending = useApi(() => api.get('/api/admin/verification/pending', { query: { search } }), [search]);
  // Pull all students once for stat tiles + tab content (filter client-side
  // by status). Search is server-side so the listing stays focused.
  const students = useApi(
    () => api.get('/api/admin/verification/students', { query: { search } }),
    [search],
  );

  // ── stats derived from full list (search-aware) ───────────────────────
  const stats = useMemo(() => {
    const all = students.data?.users ?? [];
    const acc = { total: all.length, PENDING: 0, VERIFIED: 0, REJECTED: 0, REVOKED: 0 };
    for (const u of all) acc[u.verificationStatus] = (acc[u.verificationStatus] ?? 0) + 1;
    return acc;
  }, [students.data]);

  // ── current tab list ──────────────────────────────────────────────────
  const list = useMemo(() => {
    if (tab === 'PENDING') return pending.data?.users ?? [];
    const all = students.data?.users ?? [];
    if (tab === 'ALL') return all;
    return all.filter((u) => u.verificationStatus === tab);
  }, [tab, pending.data, students.data]);

  const loading = tab === 'PENDING' ? pending.loading : students.loading;

  const refresh = () => { pending.refetch(); students.refetch(); };

  // ── actions ───────────────────────────────────────────────────────────
  const approve = async (u) => {
    try {
      const res = await api.post(`/api/admin/verification/students/${u.id}/approve`);
      toast.success(`Approved ${u.fullName}.`);
      // Surface the freshly-issued password to the admin one-shot.
      if (res?.password) setCredential({ user: res.user ?? u, password: res.password, label: 'Approved' });
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const revoke = async (u) => {
    const ok = await confirm({
      title: `Revoke ${u.fullName}?`,
      message: 'They will be signed out and unable to log in. Their team membership stays for now.',
      tone: 'crit', confirmLabel: 'Revoke',
    });
    if (!ok) return;
    try {
      await api.post(`/api/admin/verification/students/${u.id}/revoke`);
      toast.success('Access revoked.');
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const revealCredentials = async (u) => {
    const ok = await confirm({
      title: `Reveal credentials for ${u.fullName}?`,
      message:
        'The current password is hashed and unrecoverable. To show a usable code, the system will REISSUE a new 6-digit password — replacing the current one. Share it with the user manually; admin actions do not send email.',
      confirmLabel: 'Reissue & reveal',
    });
    if (!ok) return;
    try {
      const res = await api.post(`/api/admin/verification/students/${u.id}/reissue-password`);
      if (res?.password) setCredential({ user: res.user ?? u, password: res.password, label: 'Reissued' });
      toast.success('New password issued.');
    } catch (e) { toast.error(e.message); }
  };

  const restore = async (u) => {
    const ok = await confirm({
      title: `Undo revoke for ${u.fullName}?`,
      message: 'This restores login access and issues a fresh 6-digit password. Share it with the student manually; admin actions do not send email.',
      confirmLabel: 'Undo revoke',
    });
    if (!ok) return;
    try {
      const res = await api.post(`/api/admin/verification/students/${u.id}/restore`);
      if (res?.password) setCredential({ user: res.user ?? u, password: res.password, label: 'Restored' });
      toast.success('Access restored.');
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader
        kicker="VERIFICATION QUEUE"
        title="OPERATIVE REVIEW"
        description="Approve or reject self-registered students. Approving issues a 6-digit password shown once on this screen — share it with the student manually. Coordinator approvals send the email; admin approvals do not."
      />

      <div className="relative mb-8 w-full">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
        <input
          className="input-glass !h-14 !pl-12 !bg-[#050505] border-white/10 focus:border-white/40"
          placeholder="Search name / email / reg #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Stat tiles ─────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={Users}        label="Total"     value={stats.total} />
        <StatTile icon={ShieldCheck}  label="Verified"  value={stats.VERIFIED} tone="live" hint="Cleared to log in" />
        <StatTile icon={Clock}        label="Pending"   value={stats.PENDING}  tone="warn" hint="Awaiting review" />
        <StatTile icon={ShieldAlert}  label="Rejected"  value={stats.REJECTED} tone="crit" />
        <StatTile icon={ShieldOff}    label="Revoked"   value={stats.REVOKED}  tone="crit" />
      </div>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'PENDING',  label: 'Pending',  badge: stats.PENDING  || undefined },
          { value: 'VERIFIED', label: 'Verified', badge: stats.VERIFIED || undefined },
          { value: 'REJECTED', label: 'Rejected', badge: stats.REJECTED || undefined },
          { value: 'REVOKED',  label: 'Revoked',  badge: stats.REVOKED  || undefined },
          { value: 'ALL',      label: 'All',      badge: stats.total    || undefined },
        ]}
      />

      {loading && <CardSkeleton rows={4} />}
      {!loading && list.length === 0 && (
        <Empty
          icon={ShieldCheck}
          title="Nothing here"
          description={tab === 'PENDING'
            ? 'No pending registrations. New self-registrations land here for review.'
            : `No ${tab.toLowerCase()} accounts match your filters.`}
        />
      )}

      {list.length > 0 && (
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] md:min-w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <Th>Operative</Th>
                <Th>Email</Th>
                <Th>Reg #</Th>
                <Th>Institution</Th>
                <Th>Domain</Th>
                {tab === 'PENDING' && <Th>Match</Th>}
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.registrationNo ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.institution?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.domain?.name ?? '—'}</td>
                  {tab === 'PENDING' && (
                    <td className="px-4 py-3">
                      {u.registryMatch?.matched
                        ? <Badge tone={u.registryMatch.emailMatches === false ? 'warn' : 'live'} dot>
                            {u.registryMatch.emailMatches === false ? 'Email mismatch' : 'Matched'}
                          </Badge>
                        : <Badge tone="warn">No match</Badge>}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[u.verificationStatus]} dot>{titleCase(u.verificationStatus)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {u.verificationStatus === 'PENDING' && (
                        <>
                          <button className="glow-button text-[10px]" onClick={() => approve(u)}>Approve</button>
                          <button className="danger-button text-[10px]" onClick={() => setReject(u)}>Reject</button>
                        </>
                      )}
                      {u.verificationStatus === 'VERIFIED' && (
                        <>
                          <button
                            className="ghost-button inline-flex items-center gap-1 text-[10px]"
                            onClick={() => revealCredentials(u)}
                            title="Reissue + reveal a fresh 6-digit password"
                          >
                            <Eye size={10}/> Reveal
                          </button>
                          <button className="danger-button text-[10px]" onClick={() => revoke(u)}>Revoke</button>
                        </>
                      )}
                      {u.verificationStatus === 'REVOKED' && (
                        <button className="glow-button text-[10px]" onClick={() => restore(u)}>Undo revoke</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}

      <RejectModal target={reject} onClose={() => setReject(null)} onDone={refresh} />
      <CredentialModal cred={credential} onClose={() => setCredential(null)} />
    </>
  );
};

const Th = ({ children, align }) => (
  <th className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
);

const RejectModal = ({ target, onClose, onDone }) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!target) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/admin/verification/students/${target.id}/reject`, { reason: reason.trim() || undefined });
      toast.success('Rejection sent.');
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Reject ${target.fullName}?`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Reason" hint="Optional. Surfaces in the rejection email.">
          <textarea className="input-glass min-h-[100px]" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="danger-button">{busy ? <Spinner size={12}/> : 'Reject'}</button>
        </div>
      </form>
    </Modal>
  );
};

const CredentialModal = ({ cred, onClose }) => {
  const toast = useToast();
  if (!cred) return null;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard.');
    } catch {
      toast.warn('Copy failed — select and copy manually.');
    }
  };

  return (
    <Modal open onClose={onClose} size="sm" title={`${cred.label}: credentials`}
      footer={
        <button className="glow-button" onClick={onClose}>Done</button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-none border border-white/20 bg-white/5 p-3 font-mono text-[11px] leading-relaxed text-white/60">
          One-shot reveal. The plaintext password is not stored — only its bcrypt hash. Copy or share now; closing this modal discards it from the UI.
        </div>

        <CredRow
          label="Email"
          value={cred.user?.email ?? '—'}
          onCopy={() => copy(cred.user?.email ?? '')}
        />
        <CredRow
          label="Password"
          value={cred.password}
          onCopy={() => copy(cred.password)}
          mono
        />
      </div>
    </Modal>
  );
};

const CredRow = ({ label, value, onCopy, mono }) => (
  <div>
    <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">{label}</div>
    <div className="flex items-center gap-2">
      <code className={`flex-1 select-all rounded-none border border-white/10 bg-white/5 px-3 py-2.5 ${mono ? 'font-sans text-[20px] font-bold tracking-[0.4em] text-white' : 'font-mono text-[13px] text-text-primary'}`}>
        {value}
      </code>
      <button className="ghost-button inline-flex items-center gap-1" onClick={onCopy}>
        <Copy size={12} /> Copy
      </button>
    </div>
  </div>
);
