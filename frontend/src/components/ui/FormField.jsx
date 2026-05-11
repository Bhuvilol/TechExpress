import { cn } from '../../utils/cn.js';

// Labelled form field with optional inline error and help text. Wraps
// .input-glass / .select-glass / textarea to keep layouts consistent.

export const FormField = ({ label, hint, error, required, children, className }) => (
  <label className={cn('flex flex-col gap-2.5', className)}>
    <span className="flex min-h-[18px] items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-secondary">
      <span>{label}</span>
      {required && (
        <>
          <span
            aria-hidden="true"
            className="ml-0.5 text-[13px] font-extrabold leading-none"
            style={{ color: '#ef4444' }}
          >
            *
          </span>
        </>
      )}
    </span>
    {children}
    {(error || hint) && (
      <span className={cn('px-0.5 font-mono text-[11px] leading-relaxed', error ? 'text-status-crit' : 'text-text-dim')}>
        {error ?? hint}
      </span>
    )}
  </label>
);
