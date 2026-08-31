import React, { useState } from 'react';
import { Check, X, CalendarOff, MessageSquare } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, toTitleCase, initials } from '../../utils/format';

export default function ManagerLeaveApprovals({ admin }) {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const url = admin ? '/leaves/all?status=PENDING' : '/leaves/approvals';
      const res = await api.get(url);
      setList(admin ? res.data.data : res.data.data);
    } catch (err) {
      toast.error('Failed to load requests', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const review = async (action) => {
    setActing(true);
    try {
      await api.put(`/leaves/${reviewing._id}/review`, { action, comment });
      toast.success(`Leave ${action.toLowerCase()}`);
      setReviewing(null);
      setComment('');
      load();
    } catch (err) {
      toast.error('Failed to review', getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader label="Loading leave requests..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{admin ? 'Leave Requests' : 'Leave Approvals'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and decide on employee leave requests.</p>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No pending requests" message="All caught up!" icon={<CalendarOff className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {list?.map((l) => (
            <Card key={l._id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold">
                  {initials(`${l.user?.firstName} ${l.user?.lastName}`)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{l.user?.firstName} {l.user?.lastName}</p>
                    <Badge value={l.status} />
                  </div>
                  <p className="text-xs text-slate-400">{l.user?.employeeId} · {l.user?.department?.name || ''}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Type: <b className="text-slate-800 dark:text-slate-100">{toTitleCase(l.leaveType)}</b></span>
                    <span className="text-slate-500 dark:text-slate-400">Days: <b className="text-slate-800 dark:text-slate-100">{l.numberOfDays}</b></span>
                    <span className="text-slate-500 dark:text-slate-400 col-span-2">Dates: <b className="text-slate-800 dark:text-slate-100">{formatDate(l.startDate)} → {formatDate(l.endDate)}</b></span>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                    {l.reason}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="success" size="sm" className="flex-1" onClick={() => setReviewing(l)}><Check className="w-4 h-4" /> Approve</Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => { setReviewing(l); setComment('Rejected'); }}><X className="w-4 h-4" /> Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title={`Review leave — ${reviewing?.user?.firstName || ''} ${reviewing?.user?.lastName || ''}`}
        subtitle={`${toTitleCase(reviewing?.leaveType || '')} · ${reviewing?.numberOfDays} day(s)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button variant="success" onClick={() => review('APPROVED')} loading={acting}><Check className="w-4 h-4" /> Approve</Button>
            <Button variant="danger" onClick={() => review('REJECTED')} loading={acting}><X className="w-4 h-4" /> Reject</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">{reviewing?.reason}</div>
          <div className="relative">
            <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <textarea
              className="input !pl-9"
              rows={3}
              placeholder="Add a comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
