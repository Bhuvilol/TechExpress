import { cn } from '../../utils/cn.js';

// Horizontal tab strip. Caller controls active state via `value`.

export const Tabs = ({ value, onChange, items, className }) => (
  <div className={cn('flex justify-start md:justify-center overflow-x-auto flex-nowrap gap-1 border-b border-border-dim no-scrollbar', className)}>
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative flex items-center gap-2 px-6 py-4 font-sans text-[13px] font-semibold transition-colors duration-160 ease-out-expo',
            active ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {item.icon && <item.icon size={16} />}
          <span>{item.label}</span>
          {item.badge != null && (
            <span className={cn(
              'rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold transition-all duration-160',
              active ? 'bg-accent-cyan-soft text-accent-cyan' : 'bg-bg-surface-2 text-text-dim',
            )}>
              {item.badge}
            </span>
          )}
          {active && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] bg-accent-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          )}
        </button>
      );
    })}
  </div>
);
