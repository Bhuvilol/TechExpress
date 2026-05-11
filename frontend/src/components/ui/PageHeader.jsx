import { cn } from '../../utils/cn.js';

// Page title + optional kicker eyebrow + right-side actions slot.
// Title in sans (no uppercase). Kicker is the only ALL-CAPS element.

export const PageHeader = ({ kicker, title, description, actions, className }) => (
  <header
    className={cn(
      'mb-10 flex flex-col gap-6 border-b border-border-dim pb-8 md:flex-row md:items-end md:justify-between fade-in',
      className,
    )}
  >
    <div className="flex-1 min-w-0 space-y-3">
      {kicker && (
        <div className="kicker">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-soft" />
          {kicker}
        </div>
      )}
      <h1 className="font-sans text-[28px] font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-[36px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl font-sans text-[14px] leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">{actions}</div>}
  </header>
);
