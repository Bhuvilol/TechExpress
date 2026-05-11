import { cn } from '../../utils/cn.js';

// Big-number tile. The number is the hero; label is mono caps below the icon.
// Hover lifts the surface 1 elevation tier and tints the icon.

export const StatTile = ({ label, value, hint, icon: Icon, tone = 'default', className }) => {
  const iconTone =
    tone === 'live' ? 'text-status-live'
    : tone === 'warn' ? 'text-status-warn'
    : tone === 'crit' ? 'text-status-crit'
    : 'text-accent-cyan';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-sm border border-border-dim bg-bg-surface-1 p-6',
        'transition-all duration-160 ease-out-expo hover:border-border-active hover:bg-bg-surface-2',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-text-dim">
          {label}
        </span>
        {Icon && (
          <Icon
            size={16}
            className={cn('transition-colors duration-160', 'text-text-mute', `group-hover:${iconTone}`)}
          />
        )}
      </div>
      <div className="mt-5 font-sans text-[44px] font-black leading-none tracking-tight text-text-primary">
        {value}
      </div>
      {hint && (
        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          {hint}
        </div>
      )}
      {/* Subtle bottom accent that appears on hover */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-0 transition-opacity duration-320 group-hover:opacity-60" />
    </div>
  );
};
