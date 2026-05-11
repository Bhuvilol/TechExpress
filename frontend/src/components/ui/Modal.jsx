import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Lightweight modal — backdrop click + Escape to dismiss. Renders into
// document.body so it's never clipped by ancestor overflow rules.

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-bg-void/85 px-4 py-8 backdrop-blur-md fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex w-full max-h-[88vh] flex-col rounded-sm border border-border-mid bg-bg-surface-1 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(34,211,238,0.05)]',
          SIZES[size],
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ animation: 'fadeIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="flex items-center justify-between border-b border-border-dim px-6 py-4 bg-bg-surface-2">
          <h3 className="font-sans text-[15px] font-bold text-text-primary">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1.5 text-text-secondary transition-all duration-160 hover:bg-bg-surface-3 hover:text-accent-cyan"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border-dim px-6 py-4 bg-bg-surface-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
