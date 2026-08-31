import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock4, CalendarOff, TrendingUp, Activity, Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard, Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Feedback';
import { timeAgo, formatDate, toTitleCase } from '../../utils/format';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function ManagerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/dashboard/manager').then((res) => setData(res.data.data)).catch((err) => toast.error('Failed to load dashboard', getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <PageLoader label="Loading team dashboard..." />;

  const d = data;
  const pieData = [
    { name: 'Present', value: d.present },
    { name: 'Absent', value: d.absent },
    { name: 'Half Day', value: d.half },
    { name: 'On Leave', value: d.onLeave },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-brand-500 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/70">Team Overview</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-white/85 mt-2">Managing {d.teamSize} team member(s) · {d.attendanceRate}% attendance today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Team Size" value={d.teamSize} color="brand" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Present Today" value={d.present} color="green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Absent Today" value={d.absent} color="red" />
        <StatCard icon={<Clock4 className="w-6 h-6" />} label="Late Today" value={d.late} color="amber" />
        <StatCard icon={<CalendarOff className="w-6 h-6" />} label="Pending Leaves" value={d.pendingLeaves.length} color="violet" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Today's Attendance" icon={<Activity className="w-5 h-5" />} />
          <div className="px-5 pb-5 h-64">
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center pt-20">No attendance data yet today.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Monthly Attendance" subtitle="This month so far" icon={<TrendingUp className="w-5 h-5" />} />
          <div className="px-5 pb-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Present', count: d.monthSummary.present },
                { name: 'Absent', count: d.monthSummary.absent },
                { name: 'Half', count: d.monthSummary.half },
                { name: 'Leave', count: d.monthSummary.leaveDays },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Pending Leave Requests" icon={<CalendarOff className="w-5 h-5" />} action={<Link to="/manager/leave-approvals" className="text-xs font-semibold text-brand-600">Review →</Link>} />
            <div className="px-5 pb-5 space-y-2">
              {d.pendingLeaves.length === 0 && <p className="text-sm text-slate-400">No pending requests.</p>}
              {d.pendingLeaves.slice(0, 4).map((l) => (
                <div key={l._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium">{l.user?.firstName} {l.user?.lastName}</p>
                    <p className="text-xs text-slate-400">{toTitleCase(l.leaveType)} · {formatDate(l.startDate)}</p>
                  </div>
                  <Badge value="PENDING" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Recent Reviews" icon={<Star className="w-5 h-5" />} action={<Link to="/manager/performance" className="text-xs font-semibold text-brand-600">Manage →</Link>} />
            <div className="px-5 pb-5 space-y-2">
              {d.recentReviews.length === 0 && <p className="text-sm text-slate-400">No reviews yet.</p>}
              {d.recentReviews.slice(0, 4).map((r) => (
                <div key={r._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium">{r.period}</p>
                    <p className="text-xs text-slate-400">{r.ratings?.overallRating ? `${r.ratings.overallRating}/5 rating` : 'No rating yet'}</p>
                  </div>
                  <Badge value={r.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
