import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  Infinity, ShieldCheck, LogOut, Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

const NAV = [
  { to: '/coordinator', end: true, label: 'Student Review', icon: ShieldCheck },
];

export const CoordinatorShell = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <div className="flex min-h-screen bg-black">
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/5 bg-[#050505] transition-transform duration-300 md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <Link to="/" onClick={close} className="flex items-center gap-3 border-b border-white/5 px-6 py-5 transition-opacity hover:opacity-80">
          <Infinity size={24} className="text-white" strokeWidth={2.5} />
          <span className="font-sans text-[12px] font-black tracking-[0.22em] text-white">
            VORTEX <span className="text-white/40">·</span> COORDINATOR
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-4 px-6 text-[10px] font-mono uppercase tracking-[0.3em] text-white/30">Campus Review</div>
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 border-l-2 border-transparent px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.15em] transition-all',
                'text-white/50 hover:bg-white/[0.03] hover:text-white',
                isActive && 'border-white bg-white/[0.05] text-white',
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 px-6 py-6">
          <div className="mb-2 truncate font-mono text-[10px] uppercase tracking-wider text-white/30">
            {user?.institution?.name ?? 'Campus'}
          </div>
          <div className="mb-4 truncate font-mono text-[10px] uppercase tracking-wider text-white/20">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-none border border-white/10 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white hover:text-black"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-[260px]">
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/90 px-6 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <Infinity size={22} className="text-white" />
            <span className="font-sans text-[12px] font-black uppercase tracking-[0.2em] text-white">Coordinator</span>
          </div>
          <button onClick={() => setIsOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
