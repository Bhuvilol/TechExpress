import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, ArrowRight, Inbox, Megaphone, ExternalLink,
  Github, Linkedin, IdCard, GraduationCap, Layers, Search, UserPlus, Send,
  Briefcase, FileText, Award, BookOpen, Globe,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useBroadcasts } from '../../contexts/BroadcastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

const ROLE_TONE = { ADMIN: 'crit', JURY: 'cyan', COORDINATOR: 'warn', STUDENT: 'live' };
const EXPLORE_CARD_CLASS = 'glass-card flat min-h-[188px] rounded-none px-5 py-6 transition duration-200 ease-out hover:border-white hover:bg-white/[0.04]';
const joinList = (values) => values?.length ? values.join(', ') : '-';

const ProfileTab = ({ user }) => (
  <div className="grid gap-6 md:grid-cols-3">
    <section className="glass-card flat md:col-span-2">
      <div className="mb-6 flex items-center gap-3">
        <User size={18} className="text-white" />
        <h2 className="font-sans text-[14px] font-black uppercase tracking-[0.2em] text-white">Profile Identity</h2>
      </div>
      <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
        <Field icon={User} label="Name" value={user.fullName} />
        <Field icon={Mail} label="Email" value={user.email} />
        <Field icon={IdCard} label="Registration #" value={user.registrationNo ?? '-'} />
        <Field icon={GraduationCap} label="Institution" value={user.institution?.name ?? '-'} />
        <Field icon={Layers} label="Preferred Domain" value={user.domain?.name ?? '-'} />
        <Field icon={GraduationCap} label="Degree" value={user.degree ?? '-'} />
        <Field icon={BookOpen} label="Year / Semester" value={user.yearSemester ?? '-'} />
        <Field icon={Mail} label="Phone" value={user.phone ?? '-'} />
        <Field icon={Briefcase} label="Preferred Team Role" value={user.preferredTeamRole ?? '-'} />
        <Field icon={Award} label="Contribution Areas" value={joinList(user.contributionAreas)} />
      </dl>

      <ProfileCopySection title="Bio" value={user.bio} />
      {user.preferredDomainDetails?.length ? (
        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">Preferred domains</div>
          <div className="flex flex-wrap gap-1.5">
            {user.preferredDomainDetails.map((domain) => (
              <Badge key={domain.id} tone="dim">{domain.name}</Badge>
            ))}
          </div>
        </div>
      ) : null}
      <ProfileCopySection title="Technical Skills" value={user.technicalSkills} />
      <ProfileCopySection title="Non-Technical Skills" value={user.nonTechnicalSkills} />
      <ProfileCopySection title="Achievements" value={user.achievements} />
      <ProfileCopySection title="Hackathon Experience" value={user.hackathonExperience} />
      <ProfileCopySection title="Certifications / Achievements" value={user.certificationsAchievements} />
      <ProfileCopySection title="Project / Startup / Initiative" value={user.projectInitiative} />
      <ProfileCopySection title="Participation Experience" value={user.participationExperience} />

      <ProfileLinks user={user} />
    </section>

    <aside className="glass-card flat space-y-6">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-none border border-white/10 bg-black font-sans text-[18px] font-black text-white">
          {(user.fullName ?? '?').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-sans text-[15px] font-black text-white uppercase">{user.fullName}</div>
          <Badge tone={ROLE_TONE[user.role]}>{user.role}</Badge>
        </div>
      </div>

      <div className="border-t border-white/5 pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">Status</div>
        <Badge tone={user.verificationStatus === 'VERIFIED' ? 'live' : 'warn'}>
          {titleCase(user.verificationStatus)}
        </Badge>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <Link to="/teams" className="glow-button inline-flex w-full items-center justify-center gap-2">
          Team Hub <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  </div>
);

const Field = ({ icon: Icon, label, value }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.3em] text-white/30">
      <Icon size={12} /> {label}
    </div>
    <div className="font-mono text-[13px] font-bold text-white/80">{value}</div>
  </div>
);

const ProfileCopySection = ({ title, value }) => {
  if (!value) return null;
  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">{title}</div>
      <p className="font-mono text-[13px] leading-relaxed text-white/60">{value}</p>
    </div>
  );
};

const ProfileLinks = ({ user }) => {
  const links = [
    { href: user.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    { href: user.githubUrl, label: 'GitHub', icon: Github },
    { href: user.portfolioUrl, label: 'Portfolio', icon: Globe },
    { href: user.resumeDriveLink, label: 'Resume', icon: FileText },
    { href: user.researchPublicationUrl, label: 'Publication', icon: BookOpen },
  ].filter((item) => item.href);

  if (!links.length) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="ghost-button inline-flex items-center gap-2"
        >
          <Icon size={12} /> {label}
        </a>
      ))}
    </div>
  );
};

const InboxTab = () => {
  const toast = useToast();
  const invites = useApi(() => api.get('/api/invites/me'), []);
  const requests = useApi(() => api.get('/api/join-requests/me'), []);

  useSocketEvent('invite:received', () => invites.refetch(), [invites.refetch]);

  const accept = async (id) => {
    try {
      await api.post(`/api/invites/${id}/accept`);
      toast.success('Joined the team.');
      invites.refetch();
      requests.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const decline = async (id) => {
    try {
      await api.post(`/api/invites/${id}/decline`);
      toast.info('Invite declined.');
      invites.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cancel = async (id) => {
    try {
      await api.post(`/api/join-requests/${id}/cancel`);
      toast.info('Request cancelled.');
      requests.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="font-mono text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Pending invites</h2>
        {invites.loading && <CardSkeleton rows={2} />}
        {invites.data?.invites.length === 0 && (
          <Empty icon={Inbox} title="No pending invites" description="Leaders can send you invites from the Teams page." />
        )}
        {invites.data?.invites.map((inv) => (
          <article key={inv.id} className="glass-card flat space-y-4 border-white/10 hover:border-white">
            <div>
              <div className="font-sans text-[16px] font-black text-white uppercase tracking-tight">{inv.team.name}</div>
              <div className="font-mono text-[12px] text-white/40 mt-1">
                {inv.team.domain?.name} · led by {inv.team.leader?.fullName}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-text-dim">{formatRelative(inv.createdAt)}</span>
              <div className="flex gap-2">
                <button className="ghost-button" onClick={() => decline(inv.id)}>Decline</button>
                <button className="glow-button" onClick={() => accept(inv.id)}>Accept</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">My outgoing requests</h2>
        {requests.loading && <CardSkeleton rows={2} />}
        {requests.data?.requests.length === 0 && (
          <Empty icon={Inbox} title="No outgoing requests" description="Find a team on the Explore tab and request to join." />
        )}
        {requests.data?.requests.map((r) => (
          <article key={r.id} className="glass-card flat flex items-center justify-between gap-3">
            <div>
              <div className="font-sans text-[14px] font-bold">{r.team.name}</div>
              <div className="font-mono text-[12px] text-text-secondary">{r.team.domain?.name}</div>
            </div>
            <button className="ghost-button" onClick={() => cancel(r.id)}>Cancel</button>
          </article>
        ))}
      </section>
    </div>
  );
};

const BroadcastsTab = () => {
  const { latest } = useBroadcasts();
  if (latest.length === 0) {
    return <Empty icon={Megaphone} title="No broadcasts yet" description="Organizer announcements appear here in real time." />;
  }
  return (
    <div className="space-y-4">
      {latest.map((b) => (
        <article key={b.id} className="glass-card flat space-y-4 border-white/10 hover:border-white">
          <div className="flex items-center justify-between">
            <Badge tone="live">Signal broadcast</Badge>
            <span className="font-mono text-[11px] text-white/30">{formatRelative(b.createdAt)}</span>
          </div>
          <p className="font-mono text-[13px] leading-relaxed text-white/80">{b.message}</p>
          <div className="font-mono text-[11px] text-white/20 uppercase tracking-widest">- {b.sender?.fullName}</div>
        </article>
      ))}
    </div>
  );
};

const MemberDetailsModal = ({ member, action, busy, onInvite, onClose }) => {
  if (!member) return null;

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title="Member details"
      size="lg"
      footer={(
        <>
          <button className="ghost-button" onClick={onClose}>Close</button>
          <button
            className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action.disabled || busy}
            onClick={() => onInvite(member.id)}
            title={action.reason}
          >
            {busy ? <Spinner size={12} /> : <UserPlus size={12} />}
            {busy ? 'Sending...' : action.label}
          </button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-sans text-[22px] font-bold text-text-primary">{member.fullName}</div>
            <div className="font-mono text-[12px] text-text-secondary">{member.email}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="cyan">{member.domain?.name ?? 'No domain'}</Badge>
            {member.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
            {member.isDomainExpert && <Badge tone="warn">Expert</Badge>}
            <Badge tone={member.verificationStatus === 'VERIFIED' ? 'live' : 'warn'}>
              {titleCase(member.verificationStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={IdCard} label="Registration #" value={member.registrationNo ?? '-'} />
          <Field icon={Layers} label="Preferred Domain" value={member.domain?.name ?? '-'} />
          <Field icon={GraduationCap} label="Institution" value={member.institution?.name ?? '-'} />
          <Field icon={GraduationCap} label="Degree" value={member.degree ?? '-'} />
          <Field icon={Mail} label="Phone" value={member.phone ?? '-'} />
          <Field icon={BookOpen} label="Year / Semester" value={member.yearSemester ?? '-'} />
          <Field icon={Briefcase} label="Preferred Team Role" value={member.preferredTeamRole ?? '-'} />
          <Field icon={Award} label="Contribution Areas" value={joinList(member.contributionAreas)} />
          <Field icon={Layers} label="Match Score" value={String(member.matchScore ?? 0)} />
          <Field
            icon={Users}
            label="Team"
            value={member.membership?.team ? `${member.membership.team.name} (${member.membership.team.status})` : 'No team yet'}
          />
        </div>

        {member.preferredDomainDetails?.length ? (
          <div className="border-t border-white/10 pt-4">
            <div className="section-label mb-2">Preferred domains</div>
            <div className="flex flex-wrap gap-1.5">
              {member.preferredDomainDetails.map((domain) => (
                <Badge key={domain.id} tone={member.sharedPreferredDomains?.some((shared) => shared.id === domain.id) ? 'live' : 'dim'}>
                  {domain.name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <ProfileCopySection title="Bio" value={member.bio} />
        <ProfileCopySection title="Technical Skills" value={member.technicalSkills} />
        <ProfileCopySection title="Non-Technical Skills" value={member.nonTechnicalSkills} />
        <ProfileCopySection title="Achievements" value={member.achievements} />
        <ProfileCopySection title="Hackathon Experience" value={member.hackathonExperience} />
        <ProfileCopySection title="Certifications / Achievements" value={member.certificationsAchievements} />
        <ProfileCopySection title="Project / Startup / Initiative" value={member.projectInitiative} />
        <ProfileCopySection title="Participation Experience" value={member.participationExperience} />

        <ProfileLinks user={member} />

        <div className="border-t border-border-dim pt-4 font-mono text-[11px] text-text-dim">
          {action.reason}
        </div>
      </div>
    </Modal>
  );
};

const TeamDetailsModal = ({ team, action, busy, onRequest, onClose }) => {
  const detail = useApi(
    () => team ? api.get(`/api/teams/${team.id}`) : Promise.resolve(null),
    [team?.id],
  );

  const fullTeam = detail.data?.team ?? team;

  return (
    <Modal
      open={Boolean(team)}
      onClose={onClose}
      title="Team details"
      size="xl"
      footer={(
        <>
          <button className="ghost-button" onClick={onClose}>Close</button>
          <button
            className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={action?.disabled || busy}
            onClick={() => team && onRequest(team.id)}
          >
            {busy ? <Spinner size={12} /> : <Send size={12} />}
            {busy ? 'Sending...' : action?.label ?? 'Send request'}
          </button>
        </>
      )}
    >
      {detail.loading ? (
        <CardSkeleton rows={3} />
      ) : fullTeam ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-sans text-[22px] font-bold text-text-primary">{fullTeam.name}</div>
              <div className="font-mono text-[12px] text-text-secondary">
                {fullTeam.domain?.name ?? 'No domain'} · led by {fullTeam.leader?.fullName}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={fullTeam.status === 'FORMING' ? 'cyan' : 'dim'}>{fullTeam.status}</Badge>
              <Badge tone="dim">{fullTeam.memberCount ?? fullTeam.members?.length ?? 0} members</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={Layers} label="Domain" value={fullTeam.domain?.name ?? '-'} />
            <Field icon={User} label="Leader" value={fullTeam.leader?.fullName ?? '-'} />
            <Field icon={Users} label="Status" value={fullTeam.status ?? '-'} />
            <Field icon={Layers} label="Problem statement" value={fullTeam.problemStatement?.title ?? '-'} />
          </div>

          <div className="border-t border-border-dim pt-4">
            <div className="section-label mb-3">Team members</div>
            <div className="grid gap-3 md:grid-cols-2">
              {(fullTeam.members ?? []).map((member) => (
                <article key={member.user.id} className="rounded-none border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-sans text-[14px] font-bold text-text-primary">{member.user.fullName}</div>
                      <div className="font-mono text-[11px] text-text-secondary">{member.user.email}</div>
                    </div>
                    <Badge tone={member.role === 'LEADER' ? 'cyan' : 'dim'}>{member.role}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="dim">{member.user.domain?.name ?? 'No domain'}</Badge>
                    {member.user.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
                    {member.user.isDomainExpert && <Badge tone="warn">Expert</Badge>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 font-mono text-[11px] text-white/30">
            {action?.disabled ? action.label : 'This team is available for join requests.'}
          </div>
        </div>
      ) : (
        <Empty icon={Users} title="Team not found" description="This team detail could not be loaded." className="py-10" />
      )}
    </Modal>
  );
};

const ExploreTab = ({ user, myTeam }) => {
  const toast = useToast();
  const [memberFilter, setMemberFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [inviteingId, setInviteingId] = useState('');
  const [requestingTeamId, setRequestingTeamId] = useState('');

  const members = useApi(() => api.get('/api/teams/explore/members', { query: { matchActorDomains: true } }), []);
  const teams = useApi(() => api.get('/api/teams'), []);
  const joinable = useApi(() => api.get('/api/teams/joinable'), []);
  const outgoingRequests = useApi(() => api.get('/api/join-requests/me'), []);

  const leaderOwnTeam = myTeam?.leader?.id === user.id ? myTeam : null;
  const pendingInvites = useApi(
    () => leaderOwnTeam
      ? api.get(`/api/teams/${leaderOwnTeam.id}/invites`, { query: { status: 'PENDING' } })
      : Promise.resolve({ invites: [] }),
    [leaderOwnTeam?.id],
  );

  const joinableTeamIds = useMemo(
    () => new Set((joinable.data?.teams ?? []).map((team) => team.id)),
    [joinable.data],
  );

  const pendingRequestTeamIds = useMemo(
    () => new Set((outgoingRequests.data?.requests ?? []).map((request) => request.team.id)),
    [outgoingRequests.data],
  );

  const pendingInviteUserIds = useMemo(
    () => new Set((pendingInvites.data?.invites ?? []).map((invite) => invite.invitee.id)),
    [pendingInvites.data],
  );

  const visibleMembers = useMemo(() => {
    const all = members.data?.users ?? [];
    const needle = memberFilter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((member) =>
      [
        member.fullName,
        member.email,
        member.registrationNo,
        member.institution?.name,
        member.domain?.name,
        ...(member.preferredDomainDetails?.map((domain) => domain.name) ?? []),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [members.data, memberFilter]);

  const visibleTeams = useMemo(() => {
    const all = (teams.data?.teams ?? []).filter((team) => team.id !== myTeam?.id);
    const needle = teamFilter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((team) =>
      [team.name, team.domain?.name, team.leader?.fullName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [teams.data, teamFilter, myTeam?.id]);

  const inviteDisabledReason = useMemo(() => {
    if (!leaderOwnTeam && myTeam) return 'Only the creator of a team can send invites.';
    if (!leaderOwnTeam) return 'First create your own team.';
    if (leaderOwnTeam.status === 'FINALIZED') return 'Your team is finalized.';
    if (leaderOwnTeam.status === 'DISQUALIFIED') return 'Your team is disqualified.';
    return null;
  }, [leaderOwnTeam, myTeam]);

  const memberActionState = (member) => {
    if (pendingInviteUserIds.has(member.id)) {
      return { disabled: true, label: 'Invite pending', reason: 'An invite is already pending for this user.' };
    }
    if (member.membership?.team) {
      return {
        disabled: true,
        label: 'Already in a team',
        reason: `${member.fullName} is already in ${member.membership.team.name}.`,
      };
    }
    if (member.verificationStatus !== 'VERIFIED') {
      return {
        disabled: true,
        label: 'Not verified',
        reason: 'This user must be verified before they can join a team.',
      };
    }
    if (inviteDisabledReason) {
      return {
        disabled: true,
        label: myTeam ? 'Invite unavailable' : 'Create team first',
        reason: inviteDisabledReason,
      };
    }
    return { disabled: false, label: 'Send invite', reason: 'Ready to invite.' };
  };

  const sendInvite = async (inviteeId) => {
    if (!leaderOwnTeam) return;
    setInviteingId(inviteeId);
    try {
      await api.post(`/api/teams/${leaderOwnTeam.id}/invites`, { inviteeId });
      toast.success('Invite sent.');
      pendingInvites.refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInviteingId('');
    }
  };

  const sendJoinRequest = async (teamId) => {
    setRequestingTeamId(teamId);
    try {
      await api.post(`/api/teams/${teamId}/join-requests`);
      toast.success('Join request sent.');
      outgoingRequests.refetch();
      joinable.refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequestingTeamId('');
    }
  };

  const teamActionState = (team) => {
    if (pendingRequestTeamIds.has(team.id)) {
      return { disabled: true, label: 'Request pending' };
    }
    if (myTeam?.leader?.id === user.id) {
      return { disabled: true, label: 'You already created your own team' };
    }
    if (myTeam) {
      return { disabled: true, label: 'You are already in a team' };
    }
    if (!joinableTeamIds.has(team.id)) {
      return { disabled: true, label: 'Not accepting requests' };
    }
    return { disabled: false, label: 'Send request' };
  };

  return (
    <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-label">Available members</h2>
          <p className="font-mono text-[12px] text-text-secondary">
            Ranked by preferred-domain overlap first, then by recent registrations.
          </p>
        </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              className="input-glass !pl-10 border-white/10 focus:border-white transition-all bg-black"
              placeholder="Search operatives..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            />
          </div>
        </div>

        {members.loading || pendingInvites.loading ? <CardSkeleton rows={2} /> : null}
        {!members.loading && visibleMembers.length === 0 && (
          <Empty icon={Users} title="No members found" description="No registered student matched your current member search." />
        )}

        <div className="space-y-4">
          {visibleMembers.map((member) => {
            const action = memberActionState(member);

            return (
              <article key={member.id} className={`${EXPLORE_CARD_CLASS} flex flex-col justify-between space-y-3`}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-sans text-[15px] font-bold text-text-primary">{member.fullName}</div>
                      <div className="font-mono text-[12px] text-text-secondary">{member.email}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge tone="cyan">{member.domain?.name ?? 'No domain'}</Badge>
                      {member.sharedPreferredDomains?.length ? <Badge tone="live">Shared: {member.sharedPreferredDomains.length}</Badge> : null}
                      {member.membership?.team && <Badge tone="dim">In team</Badge>}
                      {member.verificationStatus !== 'VERIFIED' && <Badge tone="warn">{titleCase(member.verificationStatus)}</Badge>}
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] leading-relaxed text-text-secondary">
                  <span>Reg #: {member.registrationNo ?? '-'}</span>
                  <span>·</span>
                  <span>{member.institution?.name ?? 'No institution'}</span>
                  {member.membership?.team && (
                    <>
                      <span>·</span>
                      <span>{member.membership.team.name}</span>
                    </>
                  )}
                </div>

                {member.sharedPreferredDomains?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.sharedPreferredDomains.map((domain) => (
                      <Badge key={domain.id} tone="live">{domain.name}</Badge>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div>
                    <button
                      type="button"
                      className="ghost-button inline-flex items-center gap-2"
                      onClick={() => setSelectedMember(member)}
                    >
                      <ExternalLink size={12} /> View details
                    </button>
                  </div>
                  <button
                    className="ghost-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={action.disabled || inviteingId === member.id}
                    onClick={() => sendInvite(member.id)}
                    title={action.reason}
                  >
                    {inviteingId === member.id ? <Spinner size={12} /> : <UserPlus size={12} />}
                    {inviteingId === member.id ? 'Sending...' : action.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-label">Available teams</h2>
            <p className="font-mono text-[12px] text-text-secondary">
              Browse every other team and send a join request only when you are not already in one.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              className="input-glass !pl-10 border-white/10 focus:border-white transition-all bg-black"
              placeholder="Search teams..."
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            />
          </div>
        </div>

        {teams.loading || joinable.loading || outgoingRequests.loading ? <CardSkeleton rows={2} /> : null}
        {!teams.loading && visibleTeams.length === 0 && (
          <Empty icon={Users} title="No other teams visible" description="Your own team is hidden here. No other team matched your search." />
        )}

        <div className="space-y-4">
          {visibleTeams.map((team) => {
            const action = teamActionState(team);
            return (
              <article key={team.id} className={`${EXPLORE_CARD_CLASS} flex flex-col justify-between space-y-3`}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-sans text-[15px] font-bold text-text-primary">{team.name}</div>
                      <div className="font-mono text-[12px] text-text-secondary">
                        {team.domain?.name} · led by {team.leader?.fullName}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge tone={joinableTeamIds.has(team.id) ? 'cyan' : 'dim'}>{team.status}</Badge>
                      <Badge tone="dim">{team.memberCount} members</Badge>
                    </div>
                  </div>
                </button>

                <div className="font-mono text-[11px] leading-relaxed text-text-dim">
                  {action.disabled
                    ? action.label
                    : 'Open for join requests right now.'}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div>
                    <button
                      type="button"
                      className="ghost-button inline-flex items-center gap-2"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <ExternalLink size={12} /> View details
                    </button>
                  </div>
                  <button
                    className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={action.disabled || requestingTeamId === team.id}
                    onClick={() => sendJoinRequest(team.id)}
                  >
                    {requestingTeamId === team.id ? <Spinner size={12} /> : <Send size={12} />}
                    {requestingTeamId === team.id ? 'Sending...' : action.label}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <MemberDetailsModal
        member={selectedMember}
        action={selectedMember ? memberActionState(selectedMember) : { disabled: true, label: 'Invite unavailable', reason: '' }}
        busy={inviteingId === selectedMember?.id}
        onInvite={sendInvite}
        onClose={() => setSelectedMember(null)}
      />

      <TeamDetailsModal
        team={selectedTeam}
        action={selectedTeam ? teamActionState(selectedTeam) : { disabled: true, label: 'Request unavailable' }}
        busy={requestingTeamId === selectedTeam?.id}
        onRequest={sendJoinRequest}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  const me = useApi(() => api.get('/api/auth/me'), []);
  const myTeam = useApi(() => api.get('/api/teams/mine'), []);
  const u = me.data?.user ?? user;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <PageHeader
        kicker={`Session Active: ${u.fullName.split(' ')[0]}`}
        title="Mission Dashboard"
        description="Your profile, team status, inbox and live signals."
        actions={
          u.role === 'STUDENT'
            ? <Link to="/teams" className="glow-button inline-flex items-center gap-2 px-6"><Users size={14} /> <span>Team Hub</span></Link>
            : null
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'profile', label: 'Profile', icon: User },
          ...(u.role === 'STUDENT' ? [{ value: 'explore', label: 'Explore', icon: Search }] : []),
          { value: 'inbox', label: 'Inbox', icon: Inbox },
          { value: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
        ]}
      />

      <div className="fade-in">
        {me.loading
          ? <CardSkeleton rows={4} />
          : tab === 'profile'
            ? <ProfileTab user={u} />
            : tab === 'explore'
              ? <ExploreTab user={u} myTeam={myTeam.data?.team ?? null} />
              : tab === 'inbox'
                ? <InboxTab />
                : <BroadcastsTab />}
      </div>
    </section>
  );
};
