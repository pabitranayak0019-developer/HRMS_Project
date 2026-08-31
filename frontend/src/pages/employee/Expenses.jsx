import React, { useState } from 'react';
import { ReceiptText, Plus, Paperclip, Download } from 'lucide-react';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatINR, formatDate, toTitleCase } from '../../utils/format';

const CATEGORIES = ['TRAVEL', 'MEALS', 'ACCOMMODATION', 'FUEL', 'OFFICE_SUPPLIES', 'TELEPHONE', 'CLIENT_ENTERTAINMENT', 'OTHER'];

export default function Expenses() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'TRAVEL', amount: '', expenseDate: '', description: '' });
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/me', { params: { limit: 50 } });
      setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load expenses', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.expenseDate) e.expenseDate = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('amount', form.amount);
      fd.append('expenseDate', form.expenseDate);
      fd.append('description', form.description);
      if (receipt) fd.append('receipt', receipt);
      await api.post('/expenses', fd);
      toast.success('Expense submitted', 'Your claim is pending approval.');
      setOpen(false);
      setForm({ title: '', category: 'TRAVEL', amount: '', expenseDate: '', description: '' });
      setReceipt(null);
      load();
    } catch (err) {
      toast.error('Failed to submit', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReceipt = async (exp) => {
    if (!exp.receiptFile) return;
    try {
      const res = await api.get(`/documents/${exp._id}`, { responseType: 'blob' }).catch(() => null);
      window.open(uploadUrl(exp.receiptFile), '_blank');
    } catch {
      toast.error('Cannot open receipt');
    }
  };

  if (loading) return <PageLoader label="Loading expenses..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Expense Reimbursement</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Submit business expenses and track reimbursements.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Submit Expense</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total Claims', list?.length || 0],
          ['Pending', list?.filter((x) => x.status === 'PENDING').length || 0],
          ['Approved', list?.filter((x) => x.status === 'APPROVED').length || 0],
          ['Rejected', list?.filter((x) => x.status === 'REJECTED').length || 0],
        ].map(([label, val]) => (
          <Card key={label} className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{val}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="My Expense Claims" icon={<ReceiptText className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="table-th">Title</th>
                <th className="table-th">Category</th>
                <th className="table-th">Date</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Comment</th>
                <th className="table-th">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list?.length === 0 && (
                <tr><td colSpan={7}><EmptyState title="No expenses" message="Submit an expense claim to get started." icon={<ReceiptText className="w-6 h-6" />} /></td></tr>
              )}
              {list?.map((x) => (
                <tr key={x._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="table-td font-medium">{x.title}</td>
                  <td className="table-td">{toTitleCase(x.category)}</td>
                  <td className="table-td whitespace-nowrap">{formatDate(x.expenseDate)}</td>
                  <td className="table-td font-semibold">{formatINR(x.approvedAmount || x.amount)}</td>
                  <td className="table-td"><Badge value={x.status} /></td>
                  <td className="table-td text-slate-400 max-w-[180px] truncate">{x.approvalComment || '—'}</td>
                  <td className="table-td">
                    {x.receiptFile ? (
                      <a href={uploadUrl(x.receiptFile)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                        <Paperclip className="w-3.5 h-3.5" /> View
                      </a>
                    ) : '—'}
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
        title="Submit Expense Claim"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={submitting}>Submit Claim</Button></>}
      >
        <div className="space-y-4">
          <Input label="Expense Title" placeholder="e.g. Client dinner" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{toTitleCase(c)}</option>)}
            </Select>
            <Input label="Amount (₹)" type="number" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} error={errors.amount} />
          </div>
          <Input label="Expense Date" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} error={errors.expenseDate} />
          <Textarea label="Description" placeholder="Add details about this expense..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="label">Receipt (optional)</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-5 cursor-pointer hover:border-brand-400 text-sm text-slate-500 dark:text-slate-400">
              <Paperclip className="w-4 h-4" />
              {receipt ? receipt.name : 'Upload receipt image or PDF'}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
