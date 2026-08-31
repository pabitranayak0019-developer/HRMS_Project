import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../layouts/NotificationProvider';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { timeAgo, toTitleCase } from '../../utils/format';

const typeColors = {
  LEAVE_SUBMITTED: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
  LEAVE_APPROVED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
  LEAVE_REJECTED: 'bg-red-50 dark:bg-red-900/20 text-red-500',
  PAYSLIP_GENERATED: 'bg-violet-50 dark:bg-violet-900/20 text-violet-500',
  NEW_ANNOUNCEMENT: 'bg-sky-50 dark:bg-sky-900/20 text-sky-500',
  UPCOMING_HOLIDAY: 'bg-teal-50 dark:bg-teal-900/20 text-teal-500',
  EXPENSE_APPROVED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
  EXPENSE_REJECTED: 'bg-red-50 dark:bg-red-900/20 text-red-500',
  EXPENSE_SUBMITTED: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
  PERFORMANCE_REVIEW: 'bg-brand-50 dark:bg-brand-900/20 text-brand-500',
  SYSTEM: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
};

export default function Notifications() {
  const toast = useToast();
  const { notifications, markRead, markAllRead, refresh } = useNotifications();

  if (!notifications) return <PageLoader label="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay updated on leaves, payslips and announcements.</p>
        </div>
        <Button variant="secondary" onClick={markAllRead}><CheckCheck className="w-4 h-4" /> Mark all as read</Button>
      </div>

      <Card>
        <CardHeader title="All Notifications" icon={<Bell className="w-5 h-5" />} />
        <div className="px-5 pb-5 space-y-2">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications" message="You're all caught up!" icon={<Bell className="w-6 h-6" />} />
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-3 p-4 rounded-xl border ${n.isRead ? 'border-slate-100 dark:border-slate-800' : 'border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-900/10'}`}
                onClick={() => !n.isRead && markRead(n._id)}
              >
                <div className={`p-2 rounded-lg ${typeColors[n.type] || typeColors.SYSTEM}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)} · {toTitleCase(n.type.replace(/_/g, ' '))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
