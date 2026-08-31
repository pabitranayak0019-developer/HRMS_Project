import React, { useState } from 'react';
import { Users, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, initials, toTitleCase } from '../../utils/format';

export default function ManagerTeam() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    api.get('/attendance/team/month').then((res) => setData(res.data.data)).catch((err) => toast.error('Failed to load team', getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <PageLoader label="Loading your team..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Team</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data.users.length} member(s) · {data.month}</p>
      </div>

      {data.users.length === 0 ? (
        <Card><EmptyState title="No team members" message="You don't have any team members assigned yet." icon={<Users className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.users.map(({ user: u, summary, todayStatus }) => (
            <Card key={u._id} className="p-5 hover:shadow-pop transition cursor-pointer" onClick={() => navigate(`/manager/team?view=${u._id}`)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold">
                  {initials(`${u.firstName} ${u.lastName}`)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-400">{u.employeeId}</p>
                </div>
                <Badge value={todayStatus} />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div><p className="text-sm font-bold text-emerald-600">{summary.present}</p><p className="text-[10px] text-slate-400">Present</p></div>
                <div><p className="text-sm font-bold text-red-500">{summary.absent}</p><p className="text-[10px] text-slate-400">Absent</p></div>
                <div><p className="text-sm font-bold text-amber-500">{summary.half}</p><p className="text-[10px] text-slate-400">Half</p></div>
                <div><p className="text-sm font-bold text-violet-500">{summary.onLeave}</p><p className="text-[10px] text-slate-400">Leave</p></div>
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>{summary.hours?.toFixed?.(1) || '0'}h total</span>
                <span>{u.department?.name || ''}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
