import { cn } from '../../utils/cn.js';

// Shimmer-based loading placeholder. Keeps perceived performance high
// while preserving layout stability.

export const Skeleton = ({ className }) => (
  <div className={cn('shimmer rounded-sm', className)} />
);

export const CardSkeleton = ({ rows = 3 }) => (
  <div className="space-y-4 rounded-sm border border-border-dim bg-bg-surface-1 p-6 fade-in">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
    </div>
    <div className="pt-4 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full opacity-60" />
      ))}
    </div>
  </div>
);
