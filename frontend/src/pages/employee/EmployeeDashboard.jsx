import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, LogIn, LogOut, CalendarOff, Wallet, CalendarDays, Megaphone,
  Bell, CheckCircle2, Hourglass, Briefcase, TrendingUp, FileDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { getErrorMessage } from '../../services/api';
import { useFetch } from '../../hooks/useApi';
import { StatCard, Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, formatTime, formatINRShort, timeAgo, toTitleCase } from '../../utils/format';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, refetch } = useFetch('/dashboard/employee');
  const [acting, setActing] = useState(false);

  const doClock = async (action) => {
    setActing(true);
    try {
      const res = await api.post(`/attendance/${action}`);
      toast.success(res.data.message);
      refetch();
    } catch (err) {
      toast.error('Action failed', getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading || !data) return <PageLoader label="Loading your dashboard..." />;

  const d = data.data;
  const today = d.today;
  const clockedIn = Boolean(today?.clockIn);
  const clockedOut = Boolean(today?.clockOut);
  const isHoliday = d.todayStatus === 'HOLIDAY';
  const onLeave = d.todayStatus === 'ON_LEAVE';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-sky-500 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-16 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-sm text-white/70">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{user?.fullName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-white/85">
            <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {d.user?.employeeProfile?.designation || '—'}</span>
            <span>· {d.user?.department?.name || '—'}</span>
            <span>· {user?.employeeId}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-6 h-6" />} label="Today's Status" value={toTitleCase(d.todayStatus)} color={d.todayStatus === 'PRESENT' ? 'green' : d.todayStatus === 'ABSENT' ? 'red' : 'amber'} sub={today?.clockIn ? `In: ${formatTime(today.clockIn)}` : 'Not clocked in'} />
        <StatCard icon={<Hourglass className="w-6 h-6" />} label="Working Hours Today" value={today ? `${(today.workingHours || 0).toFixed(1)}h` : '0h'} color="brand" sub={today?.isLate ? 'Marked late' : 'On time'} />
        <StatCard icon={<CalendarDays className="w-6 h-6" />} label="Present This Month" value={d.monthly.present} color="green" sub={`${d.monthly.half} half days · ${d.monthly.hours}h total`} />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Latest Net Salary" value={d.latestPayslip ? formatINRShort(d.latestPayslip.netSalary) : '—'} color="violet" sub={d.latestPayslip ? `${d.latestPayslip.month}/${d.latestPayslip.year}` : 'No payslip yet'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Today's Attendance"
              subtitle={formatDate(new Date())}
              icon={<Clock className="w-5 h-5" />}
              action={<Badge value={d.todayStatus} />}
            />
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clock In</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{formatTime(today?.clockIn)}</p>
                  {today?.isLate && <Badge value="Late" className="mt-1" />}
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Clock Out</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{formatTime(today?.clockOut)}</p>
                  <p className="text-xs text-slate-400 mt-1">{(today?.workingHours || 0).toFixed(1)} hours</p>
                </div>
              </div>
              {isHoliday ? (
                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-sm font-medium text-center">
                  Today is a holiday. Enjoy your day off!
                </div>
              ) : onLeave ? (
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm font-medium text-center">
                  You are on approved leave today.
                </div>
              ) : (
                <div className="flex gap-3">
                  {!clockedIn && (
                    <Button className="flex-1 !py-2.5" onClick={() => doClock('clock-in')} loading={acting} disabled={acting}>
                      <LogIn className="w-4 h-4" /> Clock In
                    </Button>
                  )}
                  {clockedIn && !clockedOut && (
                    <Button variant="success" className="flex-1 !py-2.5" onClick={() => doClock('clock-out')} loading={acting} disabled={acting}>
                      <LogOut className="w-4 h-4" /> Clock Out
                    </Button>
                  )}
                  {clockedIn && clockedOut && (
                    <div className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Day completed
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Link to="/attendance" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View attendance history →
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Announcements" icon={<Megaphone className="w-5 h-5" />} action={<Link to="/announcements" className="text-xs font-semibold text-brand-600 dark:text-brand-400">View all</Link>} />
            <div className="px-5 pb-5 space-y-3">
              {d.announcements?.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
              {d.announcements?.map((a) => (
                <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.title}</p>
                      <Badge value={a.priority} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Leave Balance" icon={<CalendarOff className="w-5 h-5" />} action={<Link to="/leaves" className="text-xs font-semibold text-brand-600 dark:text-brand-400">Apply</Link>} />
            <div className="px-5 pb-5 space-y-3">
              {['SICK_LEAVE', 'CASUAL_LEAVE', 'PAID_LEAVE'].map((t) => (
                <div key={t}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{toTitleCase(t).replace('Leave', 'Leave')}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{d.balances?.[t]?.balance}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400"
                      style={{ width: `${Math.min(100, (d.balances?.[t]?.balance / d.balances?.[t]?.entitlement) * 100 || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Pending Requests" icon={<Hourglass className="w-5 h-5" />} />
            <div className="px-5 pb-5">
              {d.pendingLeaves?.length === 0 ? (
                <EmptyState title="All clear" message="No pending leave requests." icon={<CheckCircle2 className="w-6 h-6" />} />
              ) : (
                <div className="space-y-2">
                  {d.pendingLeaves?.map((l) => (
                    <div key={l._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{toTitleCase(l.leaveType)}</p>
                        <p className="text-xs text-slate-400">{formatDate(l.startDate)} · {l.numberOfDays} day(s)</p>
                      </div>
                      <Badge value={l.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Upcoming Holidays" icon={<CalendarDays className="w-5 h-5" />} />
            <div className="px-5 pb-5 space-y-2">
              {d.upcomingHolidays?.length === 0 && <p className="text-sm text-slate-400">No upcoming holidays.</p>}
              {d.upcomingHolidays?.map((h) => (
                <div key={h._id} className="flex items-center justify-between p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{h.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(h.date)}</p>
                  </div>
                  <Badge value="Holiday" />
                </div>
              ))}
            </div>
          </Card>

          {d.latestPayslip && (
            <Card>
              <CardHeader title="Latest Payslip" subtitle={`${d.latestPayslip.month}/${d.latestPayslip.year}`} icon={<Wallet className="w-5 h-5" />} action={<Link to="/payslips"><Button size="sm" variant="secondary"><FileDown className="w-4 h-4" /> View</Button></Link>} />
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Net Payable</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-300">{formatINRShort(d.latestPayslip.netSalary)}</span>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Recent Notifications" icon={<Bell className="w-5 h-5" />} action={<Link to="/notifications" className="text-xs font-semibold text-brand-600 dark:text-brand-400">All</Link>} />
            <div className="px-5 pb-5 space-y-2">
              {d.recentNotifications?.length === 0 && <p className="text-sm text-slate-400">No notifications.</p>}
              {d.recentNotifications?.map((n) => (
                <div key={n._id} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-1">{n.message}</p>
                    <p className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
