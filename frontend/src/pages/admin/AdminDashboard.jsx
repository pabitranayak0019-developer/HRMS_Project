import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, UserCheck, UserX, CalendarOff, IndianRupee, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard, Card, CardHeader } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Feedback';
import { formatINRShort, formatDate } from '../../utils/format';

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#14b8a6'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/dashboard/admin').then((res) => setData(res.data.data)).catch((err) => toast.error('Failed to load analytics', getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <PageLoader label="Loading company analytics..." />;

  const d = data;
  const deptData = d.deptStats || [];
  const leaveChartData = d.leaveTrend || [];
  const attData = d.attendanceTrend || [];
  const pieData = [
    { name: 'Managers', value: d.employeesByRole?.managers || 0 },
    { name: 'Employees', value: d.employeesByRole?.employees || 0 },
  ].filter((x) => x.value > 0);

  const trend = d.attendanceTrend.map((m) => ({ month: m.label, Present: m.present, Absent: m.absent, Leave: m.leaveDays }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-brand-700 rounded-2xl p-6 text-white">
        <p className="text-sm text-white/70">Company-wide Analytics</p>
        <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.firstName}</h1>
        <p className="text-sm text-white/85 mt-2">{d.activeEmployees} active employees · {d.totalDepartments} departments · {d.attendanceRate}% attendance today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Employees" value={d.totalEmployees} sub={`${d.employeesByRole?.managers} managers`} color="brand" />
        <StatCard icon={<Building2 className="w-6 h-6" />} label="Departments" value={d.totalDepartments} color="violet" />
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Present Today" value={d.present} sub={`${d.late} late`} color="green" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Absent Today" value={d.absent} sub={`${d.onLeave} on leave`} color="red" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Attendance Rate" value={`${d.attendanceRate}%`} color="sky" />
        <StatCard icon={<CalendarOff className="w-6 h-6" />} label="Pending Leaves" value={d.pendingLeaves} color="amber" />
        <StatCard icon={<IndianRupee className="w-6 h-6" />} label="Payroll (Gross)" value={formatINRShort(d.payroll.gross)} sub={`${d.payroll.payslips} slips this month`} color="green" />
        <StatCard icon={<IndianRupee className="w-6 h-6" />} label="Net Payroll" value={formatINRShort(d.payroll.net)} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance Trend" subtitle="Present vs absent vs leave days this year" icon={<TrendingUp className="w-5 h-5" />} />
          <div className="px-5 pb-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Leave" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Employees by Department" icon={<PieIcon className="w-5 h-5" />} />
          <div className="px-5 pb-5 h-72">
            {deptData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center pt-20">No departments yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="count" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Leave Trends" subtitle="Approved leave days by type" icon={<BarChart3 className="w-5 h-5" />} />
          <div className="px-5 pb-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leaveChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="SICK_LEAVE" stroke="#2563eb" strokeWidth={2} dot={false} name="Sick" />
                <Line type="monotone" dataKey="CASUAL_LEAVE" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Casual" />
                <Line type="monotone" dataKey="PAID_LEAVE" stroke="#f59e0b" strokeWidth={2} dot={false} name="Paid" />
                <Line type="monotone" dataKey="UNPAID_LEAVE" stroke="#ef4444" strokeWidth={2} dot={false} name="Unpaid" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming Holidays" icon={<Building2 className="w-5 h-5" />} action={<Link to="/admin/holidays" className="text-xs font-semibold text-brand-600">Manage →</Link>} />
          <div className="px-5 pb-5 space-y-2">
            {d.upcomingHolidays?.length === 0 && <p className="text-sm text-slate-400">No upcoming holidays.</p>}
            {d.upcomingHolidays?.map((h) => (
              <div key={h._id} className="flex items-center justify-between p-3 rounded-lg bg-sky-50/60 dark:bg-sky-900/10">
                <div>
                  <p className="text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(h.date)}</p>
                </div>
                <span className="text-xs font-semibold text-sky-600">{h.type}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
