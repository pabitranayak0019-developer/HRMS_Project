import React from 'react';
import { toTitleCase } from '../../utils/format';

const map = {
  PRESENT: { label: 'Present', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  ABSENT: { label: 'Absent', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  HALF_DAY: { label: 'Half Day', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  ON_LEAVE: { label: 'On Leave', cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  HOLIDAY: { label: 'Holiday', cls: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  WEEKEND: { label: 'Weekend', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  UPCOMING: { label: 'Upcoming', cls: 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700' },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  INACTIVE: { label: 'Inactive', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  TERMINATED: { label: 'Terminated', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  GENERATED: { label: 'Generated', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  PAID: { label: 'Paid', cls: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800' },
  LOW: { label: 'Low', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  NORMAL: { label: 'Normal', cls: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  HIGH: { label: 'High', cls: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  URGENT: { label: 'Urgent', cls: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  SUBMITTED: { label: 'Submitted', cls: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

export const Badge = ({ value, label, className = '' }) => {
  const key = String(value || '').toUpperCase();
  const cfg = map[key] || { label: toTitleCase(value) || '—', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls} ${className}`}>
      {label || cfg.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    HR_ADMIN: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    MANAGER: 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    EMPLOYEE: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[role] || map.EMPLOYEE}`}>
      {role === 'HR_ADMIN' ? 'HR Admin' : role === 'MANAGER' ? 'Manager' : 'Employee'}
    </span>
  );
};
