import { cn } from '../../utils/cn.js';

// Empty state with title + description + optional CTA. Tells the user what
// to do next, never just "no data".

export const Empty = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-5 px-6 py-20 text-center',
      'rounded-sm border border-border-dim bg-bg-surface-1/60 fade-in',
      className,
    )}
  >
    {Icon && (
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent-cyan/20 blur-xl" />
        <div className="relative rounded-sm border border-border-mid bg-bg-surface-2 p-4 text-accent-cyan">
          <Icon size={26} strokeWidth={1.5} />
        </div>
      </div>
    )}
    <div className="max-w-sm space-y-2">
      <div className="font-sans text-[16px] font-bold text-text-primary">{title}</div>
      {description && (
        <p className="font-sans text-[13px] leading-relaxed text-text-secondary">{description}</p>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);
