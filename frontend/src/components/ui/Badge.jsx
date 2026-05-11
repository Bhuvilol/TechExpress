import { cn } from '../../utils/cn.js';

// Tonal pill for statuses. Each tone is a distinct signal color.
// Use `dot` to render a small leading status dot.

const TONE = {
  cyan: 'border-accent-cyan/40 text-accent-cyan bg-accent-cyan-soft',
  live: 'border-status-live/40 text-status-live bg-status-live/10',
  warn: 'border-status-warn/40 text-status-warn bg-status-warn/10',
  crit: 'border-status-crit/40 text-status-crit bg-status-crit/10',
  dim:  'border-border-mid text-text-secondary bg-bg-surface-2',
};

const DOT = {
  cyan: 'bg-accent-cyan',
  live: 'bg-status-live',
  warn: 'bg-status-warn',
  crit: 'bg-status-crit',
  dim:  'bg-text-dim',
};

export const Badge = ({ tone = 'dim', dot, children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]',
      TONE[tone],
      className,
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse-soft', DOT[tone])} />}
    {children}
  </span>
);
