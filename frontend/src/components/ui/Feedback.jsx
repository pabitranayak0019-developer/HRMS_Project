import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const Spinner = ({ className = 'w-6 h-6' }) => (
  <svg className={`animate-spin text-brand-600 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const PageLoader = ({ label = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <Spinner className="w-8 h-8" />
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
  </div>
);

export const EmptyState = ({ title = 'Nothing here yet', message, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">{icon || <Inbox className="w-8 h-8" />}</div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Something went wrong while loading.', onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 mb-4">
      <AlertCircle className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Failed to load</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{message}</p>
    {onRetry && (
      <div className="mt-5">
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )}
  </div>
);

export const Skeleton = ({ className = 'h-4' }) => (
  <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-800 ${className}`} />
);
