import React, { useState } from 'react';
import { Check, X, ReceiptText, MessageSquare } from 'lucide-react';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatINR, formatDate, toTitleCase } from '../../utils/format';

export default function ManagerExpenses({ admin }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [comment, setComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(admin ? '/expenses/all?status=PENDING' : '/expenses/approvals');
      setList(admin ? res.data.data : res.data.data);
    } catch (err) {
      toast.error('Failed to load claims', getErrorMessage(err));
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
      await api.put(`/expenses/${reviewing._id}/review`, {
        action,
        comment,
        approvedAmount: action === 'APPROVED' && approvedAmount ? Number(approvedAmount) : undefined,
      });
      toast.success(`Expense ${action.toLowerCase()}`);
      setReviewing(null);
      setComment('');
      setApprovedAmount('');
      load();
    } catch (err) {
      toast.error('Failed to review', getErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader label="Loading expense claims..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{admin ? 'Expense Claims' : 'Expense Approvals'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review employee expense reimbursement requests.</p>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No pending claims" message="All caught up!" icon={<ReceiptText className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {list?.map((x) => (
            <Card key={x._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{x.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{x.user?.firstName} {x.user?.lastName} · {x.user?.employeeId}</p>
                </div>
                <Badge value={x.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-500">Amount: <b className="text-slate-800 dark:text-slate-100">{formatINR(x.amount)}</b></span>
                <span className="text-slate-500">Category: <b className="text-slate-800 dark:text-slate-100">{toTitleCase(x.category)}</b></span>
                <span className="text-slate-500">Date: <b className="text-slate-800 dark:text-slate-100">{formatDate(x.expenseDate)}</b></span>
              </div>
              {x.description && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">{x.description}</p>}
              {x.receiptFile && (
                <a href={uploadUrl(x.receiptFile)} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  View receipt →
                </a>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="success" size="sm" className="flex-1" onClick={() => { setReviewing(x); setApprovedAmount(x.amount); }}><Check className="w-4 h-4" /> Approve</Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={() => setReviewing(x)}><X className="w-4 h-4" /> Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title={`Review claim — ${reviewing?.title || ''}`}
        subtitle={reviewing ? `Requested ${formatINR(reviewing.amount)}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button variant="success" onClick={() => review('APPROVED')} loading={acting}><Check className="w-4 h-4" /> Approve</Button>
            <Button variant="danger" onClick={() => review('REJECTED')} loading={acting}><X className="w-4 h-4" /> Reject</Button>
          </>
        }
      >
        <div className="space-y-4">
          <input type="number" className="input" placeholder="Approved amount (₹)" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
          <div className="relative">
            <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <textarea className="input !pl-9" rows={3} placeholder="Add a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
