import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  Infinity, Users, ShieldCheck, Settings, Lock, Megaphone,
  History, Layers, ListChecks, LogOut, Menu, X, FlaskConical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

const NAV = [
  { to: '/admin',                end: true, label: 'Overview',     icon: Layers   },
  { to: '/admin/verification',              label: 'Verification', icon: ShieldCheck },
  { to: '/admin/teams',                     label: 'Teams',        icon: Users     },
  { to: '/admin/rules',                     label: 'Rules',        icon: Settings  },
  { to: '/admin/rounds',                    label: 'Rounds',       icon: Lock      },
  { to: '/admin/taxonomy',                  label: 'Taxonomy',     icon: ListChecks },
  { to: '/admin/broadcast',                 label: 'Broadcast',    icon: Megaphone },
  { to: '/admin/audit',                     label: 'Audit Log',    icon: History   },
  { to: '/admin/testing',                   label: 'Testing',      icon: FlaskConical },
];


export const AdminShell = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const close = () => setIsOpen(false);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border-dim bg-bg-surface-1 transition-transform duration-320 ease-out-expo md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link to="/" onClick={close} className="group flex items-center gap-3 border-b border-border-dim px-6 py-5 transition-colors duration-160 hover:bg-bg-surface-2">
          <Infinity size={22} className="text-accent-cyan transition-transform duration-160 group-hover:scale-110" strokeWidth={2.5} />
          <span className="font-sans text-[13px] font-black tracking-[0.22em] text-text-primary">
            VORTEX <span className="text-text-dim">·</span> <span className="text-accent-cyan">ADMIN</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-6 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-text-mute">System Control</div>
          {NAV.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) => cn(
                'group relative flex items-center gap-3 px-6 py-3 font-sans text-[13px] font-medium transition-all duration-160 ease-out-expo',
                'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary',
                isActive && 'bg-accent-cyan-soft text-accent-cyan',
              )}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 transition-all duration-160 ease-out-expo',
                      isActive ? 'bg-accent-cyan opacity-100' : 'bg-transparent opacity-0',
                    )}
                  />
                  <Icon size={15} className="shrink-0" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border-dim px-6 py-6">
          <div className="mb-4 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            Authenticated: <span className="text-text-secondary">{user?.email?.split('@')[0]}</span>
          </div>
          <button
            onClick={logout}
            className="ghost-button inline-flex w-full items-center justify-center gap-2"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-[260px]">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-border-dim bg-bg-void/90 px-6 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <Infinity size={22} className="text-accent-cyan" />
            <span className="font-sans text-[13px] font-black tracking-[0.18em] text-text-primary">Admin</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-text-secondary transition-colors duration-160 hover:text-accent-cyan"
          >
            <Menu size={20} />
          </button>
        </header>

        <main key={location.pathname} className="route-enter flex-1 px-4 py-8 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
