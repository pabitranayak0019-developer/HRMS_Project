import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md', closeOnBackdrop = true }) => {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = '');
  }, [open]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeOnBackdrop ? onClose : undefined} />
      <div className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-pop w-full ${sizes[size]} max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700`}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', message = 'This action cannot be undone.', confirmText = 'Confirm', danger = true, loading }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex items-start gap-3">
      <div className={`p-2.5 rounded-full ${danger ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-brand-50 text-brand-500'}`}>
        <AlertTriangle className="w-5 h-5" />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    </div>
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
        {confirmText}
      </Button>
    </div>
  </Modal>
);
