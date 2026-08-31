import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, icon, className = '' }) => (
  <div className={`px-5 pt-5 pb-4 flex items-start justify-between gap-3 ${className}`}>
    <div className="flex items-start gap-3">
      {icon && <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{icon}</div>}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const StatCard = ({ icon, label, value, sub, color = 'brand', className = '' }) => {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    sky: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  };
  return (
    <div className={`card p-5 flex items-start gap-4 ${className}`}>
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
};
