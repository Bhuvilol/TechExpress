import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users, FileText, Gavel, Activity, Shield } from 'lucide-react';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { homePathForRole } from '../../utils/authHome.js';

const TILES = [
  { to: '/register',         label: 'Registration',     desc: 'Submit your application — verification by organizers.', icon: Users,    accent: 'text-white' },
  { to: '/login',            label: 'Sign In',          desc: 'Returning participants, juries, coordinators and organizers.', icon: Shield, accent: 'text-white' },
  { to: '/problem-statements', label: 'Problem Statements', desc: 'The challenges available across every domain.',     icon: FileText, accent: 'text-white' },
  { to: '/leaderboard',      label: 'Leaderboard',      desc: 'Live ranking once scores are released.',                 icon: Trophy,   accent: 'text-white' },
  { to: '/awards',           label: 'Awards',           desc: 'Grand prize, domain champions and special awards.',      icon: Gavel,    accent: 'text-white' },
];

export const HomePage = () => {
  const { isAuth, user } = useAuth();
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col items-center px-6 py-20">
      <div className="kicker mb-6 border border-white/20 px-3 py-1 text-white/60">
        <span className="h-1.5 w-1.5 bg-white" />
        Mission Control · Online
      </div>

      <h1 className="text-center font-sans text-[48px] font-black leading-[1.1] sm:text-[68px] md:text-[96px] text-white">
        <ScrambleText text="VORTEX" duration={0.6} className="gradient-text" />
      </h1>

      <p className="mt-4 max-w-lg text-center font-mono text-[13px] leading-relaxed text-white/40 md:mt-6 md:max-w-2xl md:text-[14px]">
        A focused hackathon platform: register, form a squad around a problem statement,
        get evaluated across three rounds. No noise. No ceremony.
      </p>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        {isAuth ? (
          <Link
            to={homePathForRole(user.role)}
            className="glow-button flex items-center gap-3 px-8"
          >
            <span>Continue to dashboard</span>
            <ArrowRight size={18} />
          </Link>
        ) : (
          <>
            <Link to="/register" className="glow-button flex w-48 items-center justify-center gap-3">
              <span>Register now</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="ghost-button flex w-48 items-center justify-center">Sign in</Link>
          </>
        )}
      </div>

      <div className="mt-10 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        <span className="flex items-center gap-2">
          <Activity size={12} className="text-white" />
          System Operational
        </span>
        <span className="hidden md:inline">v2.0 · 2026</span>
      </div>

      <div className="mt-24 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <div key={t.to} className="glass-card group flex h-full flex-col gap-5 p-8 border-white/10 hover:border-white transition-all">
            <Link to={t.to} className="flex h-full flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center border border-white/10 group-hover:border-white transition-all">
                  <t.icon size={24} className="text-white" />
                </div>
                <ArrowRight size={18} className="text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <div className="space-y-2">
                <div className="font-sans text-[18px] font-black uppercase tracking-wider text-white">{t.label}</div>
                <p className="font-mono text-[12px] leading-relaxed text-white/40">{t.desc}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-24 h-px w-32 bg-white/10" />
      <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.5em] text-white/20">
        Vortex · Monochrome Edition
      </div>
    </section>
  );
};
