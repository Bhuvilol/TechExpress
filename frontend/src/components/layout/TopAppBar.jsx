import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Infinity, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';
import { homePathForRole } from '../../utils/authHome.js';

const NavItem = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      'rounded-sm px-3 py-2 font-sans text-[13px] font-medium transition-all duration-160 ease-out-expo',
      'text-text-secondary hover:text-text-primary hover:bg-bg-surface-2',
      isActive && 'text-accent-cyan bg-accent-cyan-soft',
      'w-full md:w-auto md:text-center',
    )}
  >
    {children}
  </NavLink>
);

export const TopAppBar = () => {
  const { user, isAuth, logout } = useAuth();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/coordinator')) return null;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-dim bg-bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <Link to="/" onClick={closeMenu} className="group flex items-center gap-3 transition-opacity duration-160 hover:opacity-80">
          <Infinity size={28} className="text-accent-cyan transition-transform duration-160 group-hover:scale-110" strokeWidth={2.5} />
          <span className="font-sans text-[15px] font-black tracking-[0.22em] text-text-primary">VORTEX</span>
          {isAuth && user && (
            <span className="hidden sm:inline font-mono text-[11px] text-text-dim truncate max-w-[140px]">
              {user.email}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/problem-statements">Problems</NavItem>
          <NavItem to="/awards">Awards</NavItem>

          {isAuth ? (
            <div className="ml-4 flex items-center gap-1 border-l border-border-dim pl-4">
              <NavItem to={homePathForRole(user.role)}>Dashboard</NavItem>
              {user.role === 'STUDENT'  && <NavItem to="/teams">Teams</NavItem>}
              {user.role === 'JURY'     && <NavItem to="/jury">Evaluations</NavItem>}
              {user.role === 'ADMIN'    && <NavItem to="/admin">Admin</NavItem>}
              {user.role === 'COORDINATOR' && <NavItem to="/coordinator">Coordinator</NavItem>}
              <button
                onClick={logout}
                className="ghost-button ml-2 inline-flex items-center gap-2"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <div className="ml-4 flex items-center gap-2">
              <NavItem to="/login">Login</NavItem>
              <Link to="/register" className="glow-button">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-sm border border-border-mid text-text-primary transition-all duration-160 hover:border-accent-cyan hover:text-accent-cyan md:hidden"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        'fixed inset-x-0 top-16 z-40 border-b border-border-dim bg-bg-void transition-all duration-320 ease-out-expo md:hidden',
        isOpen ? 'h-[calc(100vh-64px)] opacity-100' : 'h-0 overflow-hidden opacity-0',
      )}>
        <nav className="flex flex-col gap-2 p-6">
          <div className="kicker mb-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />Command Center</div>
          <NavItem to="/leaderboard" onClick={closeMenu}>Leaderboard</NavItem>
          <NavItem to="/problem-statements" onClick={closeMenu}>Problems</NavItem>
          <NavItem to="/awards" onClick={closeMenu}>Awards</NavItem>

          <div className="my-4 h-px w-full bg-border-dim" />

          {isAuth ? (
            <div className="flex flex-col gap-2">
              <NavItem to={homePathForRole(user.role)} onClick={closeMenu}>Dashboard</NavItem>
              {user.role === 'STUDENT'  && <NavItem to="/teams" onClick={closeMenu}>Teams</NavItem>}
              {user.role === 'JURY'     && <NavItem to="/jury" onClick={closeMenu}>Evaluations</NavItem>}
              {user.role === 'ADMIN'    && <NavItem to="/admin" onClick={closeMenu}>Admin</NavItem>}
              {user.role === 'COORDINATOR' && <NavItem to="/coordinator" onClick={closeMenu}>Coordinator</NavItem>}
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="ghost-button mt-6 inline-flex w-full items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <NavItem to="/login" onClick={closeMenu}>Login</NavItem>
              <Link to="/register" onClick={closeMenu} className="glow-button text-center">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
