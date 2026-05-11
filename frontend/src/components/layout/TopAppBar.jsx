import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Infinity, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { cn } from '../../utils/cn.js';
import { homePathForRole } from '../../utils/authHome.js';

const NavItem = ({ to, children, tone, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      'rounded-none px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.1em] transition-all',
      tone === 'warn' ? 'text-white' : 'text-white/40',
      'hover:bg-white hover:text-black',
      isActive && 'bg-white/10 text-white',
      'w-full md:w-auto'
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/coordinator')) return null;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-6">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-6 transition-all hover:opacity-70">
          <Infinity size={32} className="text-white" strokeWidth={2.5} />
          <span className="font-sans text-[16px] font-black tracking-[0.3em] text-white">VORTEX</span>
          {isAuth && user && (
            <span className="hidden sm:inline font-mono text-[11px] text-white/40 truncate max-w-[120px]">
              {user.email}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavItem to="/leaderboard">Leaderboard</NavItem>
          <NavItem to="/problem-statements">Problems</NavItem>
          <NavItem to="/awards">Awards</NavItem>

          {isAuth ? (
            <div className="flex items-center gap-6 ml-6 border-l border-white/10 pl-6">
              <NavItem to={homePathForRole(user.role)}>Dashboard</NavItem>
              {user.role === 'STUDENT'  && <NavItem to="/teams">Teams</NavItem>}
              {user.role === 'JURY'     && <NavItem to="/jury">Evaluations</NavItem>}
              {user.role === 'ADMIN'    && <NavItem to="/admin">Admin</NavItem>}
              {user.role === 'COORDINATOR' && <NavItem to="/coordinator">Coordinator</NavItem>}
              <button
                onClick={logout}
                className="ml-2 inline-flex items-center gap-2 rounded-none border border-white/20 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-white/60 hover:border-white hover:bg-white hover:text-black transition-all"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-4">
              <NavItem to="/login">Login</NavItem>
              <Link
                to="/register"
                className="ml-2 rounded-none bg-white px-6 py-2 font-mono text-[11px] font-black uppercase tracking-[0.1em] text-black hover:bg-white/80 transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex h-12 w-12 items-center justify-center rounded-none text-white transition-all hover:bg-white hover:text-black md:hidden"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-x-0 top-16 z-40 border-b border-white/20 bg-black transition-all duration-500 ease-in-out md:hidden",
        isOpen ? "h-[calc(100vh-64px)] opacity-100" : "h-0 overflow-hidden opacity-0"
      )}>
        <nav className="flex flex-col gap-4 p-8">
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4">Command Center</div>
          <NavItem to="/leaderboard" onClick={closeMenu}>Leaderboard</NavItem>
          <NavItem to="/problem-statements" onClick={closeMenu}>Problems</NavItem>
          <NavItem to="/awards" onClick={closeMenu}>Awards</NavItem>
          
          <div className="my-6 h-px w-full bg-white/5" />

          {isAuth ? (
            <div className="flex flex-col gap-4">
              <NavItem to={homePathForRole(user.role)} onClick={closeMenu}>Dashboard</NavItem>
              {user.role === 'STUDENT'  && <NavItem to="/teams" onClick={closeMenu}>Teams</NavItem>}
              {user.role === 'JURY'     && <NavItem to="/jury" onClick={closeMenu}>Evaluations</NavItem>}
              {user.role === 'ADMIN'    && <NavItem to="/admin" onClick={closeMenu}>Admin</NavItem>}
              {user.role === 'COORDINATOR' && <NavItem to="/coordinator" onClick={closeMenu}>Coordinator</NavItem>}
              <button
                onClick={() => { logout(); closeMenu(); }}
                className="mt-10 flex w-full items-center justify-center gap-4 rounded-none border-2 border-white py-5 font-mono text-[13px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all"
              >
                <LogOut size={18} />
                Terminate Session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-4">
              <NavItem to="/login" onClick={closeMenu}>Login</NavItem>
              <Link
                to="/register"
                onClick={closeMenu}
                className="flex w-full items-center justify-center rounded-none bg-white py-5 font-mono text-[14px] font-black uppercase tracking-[0.2em] text-black hover:bg-white/90 transition-all"
              >
                Register Now
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
