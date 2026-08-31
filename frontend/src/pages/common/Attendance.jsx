import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LogIn, LogOut, CalendarDays } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Feedback';
import { formatTime, toTitleCase } from '../../utils/format';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusStyles = {
  PRESENT: 'bg-emerald-500 text-white',
  ABSENT: 'bg-red-500 text-white',
  HALF_DAY: 'bg-amber-400 text-white',
  ON_LEAVE: 'bg-violet-500 text-white',
  HOLIDAY: 'bg-sky-400 text-white',
  WEEKEND: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  UPCOMING: 'bg-transparent text-slate-300 dark:text-slate-600',
};

export default function Attendance() {
  const { user } = useAuth();
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async (y, m) => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/me/month', { params: { year: y, month: m } });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load attendance', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
    load(y, m);
  };

  React.useEffect(() => {
    load(year, month);
  }, []);

  const doClock = async (action) => {
    setActing(true);
    try {
      const res = await api.post(`/attendance/${action}`);
      toast.success(res.data.message);
      load(year, month);
    } catch (err) {
      toast.error('Action failed', getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading && !data) return <PageLoader label="Loading attendance..." />;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = now.toISOString().slice(0, 10);
  const s = data?.summary;

  const history = data?.days?.filter((d) => d.attendance || d.status === 'ABSENT' || d.status === 'ON_LEAVE' || d.status === 'HOLIDAY').slice().reverse() || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Clock in/out and review your monthly attendance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => doClock('clock-in')} loading={acting}><LogIn className="w-4 h-4" /> Clock In</Button>
          <Button variant="success" onClick={() => doClock('clock-out')} loading={acting}><LogOut className="w-4 h-4" /> Clock Out</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Present', s?.present, 'text-emerald-600'],
          ['Half Days', s?.half, 'text-amber-500'],
          ['Absent', s?.absent, 'text-red-600'],
          ['On Leave', s?.onLeave, 'text-violet-600'],
          ['Holidays', s?.holidays, 'text-sky-500'],
          ['Total Hours', s?.totalHours?.toFixed(1), 'text-brand-600'],
        ].map(([label, val, cls]) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${cls}`}>{val ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-600" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{MONTHS[month - 1]} {year}</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); load(now.getFullYear(), now.getMonth() + 1); }}>Today</Button>
              <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="px-5 pb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="px-5 pb-5 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const day = data?.days?.find((x) => Number(x.date.slice(8, 10)) === d);
              const st = day?.status || 'UPCOMING';
              const isToday = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` === todayStr;
              return (
                <div
                  key={d}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium ${statusStyles[st]} ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''} ${st === 'UPCOMING' ? 'border border-dashed border-slate-200 dark:border-slate-700' : ''}`}
                  title={`${d} ${MONTHS[month - 1]} — ${toTitleCase(st)}${day?.holiday ? ` (${day.holiday.name})` : ''}`}
                >
                  {d}
                  {day?.holiday && <span className="text-[8px] leading-none mt-0.5 px-0.5 truncate max-w-full">🎉</span>}
                </div>
              );
            })}
          </div>
          <div className="px-5 pb-4 flex flex-wrap gap-x-4 gap-y-1">
            {[['PRESENT', 'Present'], ['ABSENT', 'Absent'], ['HALF_DAY', 'Half Day'], ['ON_LEAVE', 'Leave'], ['HOLIDAY', 'Holiday'], ['WEEKEND', 'Weekend']].map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className={`w-2.5 h-2.5 rounded ${statusStyles[k]}`} /> {v}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Daily Log</h3>
            <p className="text-xs text-slate-400">Date | Login | Logout | Hours | Status</p>
          </div>
          <div className="px-5 pb-5 overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="table-th">Date</th>
                  <th className="table-th">Login</th>
                  <th className="table-th">Logout</th>
                  <th className="table-th">Hours</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-sm text-slate-400 py-8">No records for this month.</td></tr>
                )}
                {history.map((d) => (
                  <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="table-td whitespace-nowrap">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="table-td">{formatTime(d.attendance?.clockIn)}</td>
                    <td className="table-td">{formatTime(d.attendance?.clockOut)}</td>
                    <td className="table-td">{d.attendance ? `${d.attendance.workingHours.toFixed(1)}h` : '—'}</td>
                    <td className="table-td">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${d.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600' : d.status === 'ABSENT' ? 'bg-red-50 text-red-600' : d.status === 'HALF_DAY' ? 'bg-amber-50 text-amber-600' : d.status === 'ON_LEAVE' ? 'bg-violet-50 text-violet-600' : d.status === 'HOLIDAY' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                        {toTitleCase(d.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
