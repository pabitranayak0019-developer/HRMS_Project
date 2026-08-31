import React, { useState } from 'react';
import { CalendarOff, Plus, X } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, toTitleCase } from '../../utils/format';

const LEAVE_TYPES = [
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'PAID_LEAVE', label: 'Paid Leave' },
  { value: 'UNPAID_LEAVE', label: 'Unpaid Leave' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'FULL_DAY', label: 'Full Day' },
];

export default function Leaves() {
  const toast = useToast();
  const [balances, setBalances] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('all');
  const [form, setForm] = useState({ leaveType: 'CASUAL_LEAVE', startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [b, l] = await Promise.all([
        api.get('/leaves/balances'),
        api.get('/leaves/me', { params: { limit: 50 } }),
      ]);
      setBalances(b.data.data);
      setLeaves(l.data.data);
    } catch (err) {
      toast.error('Failed to load leaves', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.endDate < form.startDate) e.endDate = 'End date cannot be before start date';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/leaves', form);
      toast.success('Leave applied', res.data.message);
      setOpen(false);
      setForm({ leaveType: 'CASUAL_LEAVE', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      toast.error('Failed to apply', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    try {
      await api.post(`/leaves/${id}/cancel`);
      toast.success('Leave cancelled');
      load();
    } catch (err) {
      toast.error('Failed to cancel', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading leaves..." />;

  const filtered = tab === 'all' ? leaves : leaves.filter((l) => l.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leave Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Apply for leave, view balances and track requests.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Apply for Leave</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {['SICK_LEAVE', 'CASUAL_LEAVE', 'PAID_LEAVE'].map((t) => {
          const b = balances?.[t];
          return (
            <Card key={t} className="p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{toTitleCase(t).replace(' Leave', '')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{b?.balance ?? '—'}</p>
              <p className="text-xs text-slate-400">of {b?.entitlement} days</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-sky-400" style={{ width: `${b?.entitlement ? Math.min(100, (b.balance / b.entitlement) * 100) : 0}%` }} />
              </div>
            </Card>
          );
        })}
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Unpaid</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">∞</p>
          <p className="text-xs text-slate-400">no limit</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Half Day</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">½</p>
          <p className="text-xs text-slate-400">from paid leave</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Full Day</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">1</p>
          <p className="text-xs text-slate-400">from paid leave</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <CardHeader title="Leave History" icon={<CalendarOff className="w-5 h-5" />} />
          <div className="flex gap-1">
            {['all', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {toTitleCase(t)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="table-th">Type</th>
                <th className="table-th">Duration</th>
                <th className="table-th">Dates</th>
                <th className="table-th">Days</th>
                <th className="table-th">Reason</th>
                <th className="table-th">Status</th>
                <th className="table-th">Comment</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr><td colSpan={8}><EmptyState title="No leave requests" message="Apply for leave to see it here." icon={<CalendarOff className="w-6 h-6" />} /></td></tr>
              )}
              {filtered.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="table-td font-medium">{toTitleCase(l.leaveType)}</td>
                  <td className="table-td">{toTitleCase(l.duration)}</td>
                  <td className="table-td whitespace-nowrap">{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
                  <td className="table-td">{l.numberOfDays}</td>
                  <td className="table-td max-w-[180px] truncate">{l.reason}</td>
                  <td className="table-td"><Badge value={l.status} /></td>
                  <td className="table-td max-w-[160px] truncate text-slate-400">{l.approvalComment || '—'}</td>
                  <td className="table-td">
                    {['PENDING', 'APPROVED'].includes(l.status) && (
                      <button onClick={() => cancel(l._id)} className="text-xs font-semibold text-red-500 hover:underline">Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply for Leave"
        subtitle="All fields are required"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={submitting}>Submit Request</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Leave Type" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
            {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} error={errors.startDate} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} error={errors.endDate} />
          </div>
          <Textarea label="Reason" placeholder="Briefly explain the reason for leave..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} error={errors.reason} />
          {form.leaveType === 'HALF_DAY' && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg">
              Note: Half day leave must be a single day and is deducted from your paid leave balance.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
