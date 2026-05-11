import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { ScrambleText } from '../../components/ui/ScrambleText.jsx';
import { homePathForRole } from '../../utils/authHome.js';

export const LoginPage = () => {
  const { login, bypassLogin } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}.`);
      const dest = loc.state?.from ?? homePathForRole(u.role);
      nav(dest, { replace: true });
    } catch (apiErr) {
      setErr(apiErr.message);
      if (apiErr.code === 'ACCOUNT_PENDING')
        setErr('Your account is awaiting campus or organizer verification.');
      if (apiErr.code === 'ACCOUNT_REJECTED')
        setErr('Your registration was not approved.');
      if (apiErr.code === 'ACCOUNT_REVOKED')
        setErr('Your access has been revoked. Contact organizers.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-6 py-20">
      <div className="flex flex-col items-center">
        <div className="kicker mb-4 inline-flex items-center gap-2 border border-white/20 px-3 py-1 uppercase tracking-[0.2em] text-[10px] text-white/60">
          <span className="h-1.5 w-1.5 bg-white" />
          Access Portal
        </div>

        <h1 className="text-center font-sans text-[42px] font-black leading-none tracking-tight sm:text-[52px] text-white">
          <ScrambleText text="SIGN IN" duration={0.4} />
        </h1>

        <p className="mt-4 text-center font-mono text-[13px] leading-relaxed text-white/40">
          Vortex Operational Network · v2.0<br />
          Secure authentication required.
        </p>
      </div>

      <div className="glass-card mt-12 border-white/10 p-8 relative overflow-hidden bg-black">
        <form onSubmit={submit} className="relative z-10 space-y-6">
          <FormField label="Identifier (Email)" required>
            <div className="group relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-white">
                <Mail size={18} />
              </div>
              <input
                type="email"
                autoComplete="email"
                required
                className="input-glass h-12 !pl-14 border-white/10 focus:border-white transition-all bg-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operative@vortex.local"
              />
            </div>
          </FormField>

          <FormField label="Access Code" required hint="Issued upon verification.">
            <div className="group relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-white">
                <Lock size={18} />
              </div>
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                className="input-glass h-12 !pl-14 tracking-[0.3em] font-mono border-white/10 focus:border-white transition-all bg-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
          </FormField>

          {err && (
            <div className="flex items-center gap-3 border border-white/30 bg-white/5 p-4 font-mono text-[12px] leading-tight text-white animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-1.5 w-1.5 shrink-0 bg-white" />
              {err}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="glow-button h-12 w-full flex items-center justify-center gap-3 font-sans font-black text-[14px] uppercase tracking-widest bg-white text-black hover:bg-[#cccccc] transition-all"
            >
              {busy ? <Spinner size={18} /> : (
                <>
                  <span>Initialize Session</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>


      <div className="mt-10 flex flex-col items-center gap-6">
        <div className="h-px w-16 bg-white/10" />
        <Link to="/register" className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 hover:text-white transition-colors">
          Register here
        </Link>
      </div>
    </section>
  );
};
