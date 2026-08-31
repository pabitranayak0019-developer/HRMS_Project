import React, { useState } from 'react';
import { IndianRupee, Plus, Pencil, Trash2, Zap, Coins } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatINR, monthOptions, yearOptions, toTitleCase } from '../../utils/format';

const COMPONENTS = [
  ['hra', 'HRA'], ['specialAllowance', 'Special Allowance'], ['conveyanceAllowance', 'Conveyance'], ['medicalAllowance', 'Medical'],
  ['travelAllowance', 'Travel'], ['bonus', 'Bonus'], ['performancePay', 'Performance Pay'], ['otherEarnings', 'Other Earnings'],
  ['pf', 'PF (12%)'], ['professionalTax', 'Professional Tax'], ['incomeTax', 'Income Tax (TDS)'], ['insuranceDeduction', 'Insurance'],
  ['loanDeduction', 'Loan Recovery'], ['otherDeductions', 'Other Deductions'],
];

export default function AdminPayroll() {
  const toast = useToast();
  const [employees, setEmployees] = useState(null);
  const [structures, setStructures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ basicSalary: '', effectiveFrom: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, s] = await Promise.all([api.get('/employees?limit=100'), api.get('/payroll/structures')]);
      setEmployees(e.data.data);
      setStructures(s.data.data);
    } catch (err) {
      toast.error('Failed to load payroll', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ basicSalary: '', effectiveFrom: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setSelectedUser(s.user._id);
    const f = { basicSalary: s.basicSalary, effectiveFrom: s.effectiveFrom.slice(0, 10) };
    COMPONENTS.forEach(([k]) => { f[k] = s[k] || 0; });
    setForm(f);
    setOpen(true);
  };

  const submit = async () => {
    if (!selectedUser) return toast.warning('Select employee', 'Please choose an employee.');
    if (!form.basicSalary) return toast.warning('Basic salary required', 'Enter a basic salary.');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/payroll/structure/${editing._id}`, form);
        toast.success('Salary structure updated');
      } else {
        await api.post(`/payroll/structure/${selectedUser}`, form);
        toast.success('Salary structure created');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error('Failed to save', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate', { month, year });
      toast.success('Payroll generated', res.data.message);
      load();
    } catch (err) {
      toast.error('Generation failed', getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/payroll/structure/${deleteTarget._id}`);
      toast.success('Structure deactivated');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading payroll..." />;

  const gross = (s) => (Number(form.basicSalary) || 0) + COMPONENTS.slice(0, 8).reduce((sum, [k]) => sum + (Number(form[k]) || 0), 0);
  const deductions = (s) => COMPONENTS.slice(8).reduce((sum, [k]) => sum + (Number(form[k]) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payroll & Salary Structure</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define salary components and run monthly payroll.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Structure</Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <p className="label">Run Monthly Payroll</p>
            <div className="flex gap-3">
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="flex-1">
                {monthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="flex-1">
                {yearOptions().map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </Select>
            </div>
          </div>
          <Button onClick={generate} loading={generating}><Zap className="w-4 h-4" /> Generate Payroll</Button>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Payroll is computed on the backend using each employee's salary structure, attendance, unpaid leave, absence and mid-month joining/exits. It creates payslips for all active employees with a structure.
        </p>
      </Card>

      <Card>
        <CardHeader title="Salary Structures" icon={<Coins className="w-5 h-5" />} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <th className="table-th">Employee</th>
                <th className="table-th">Basic</th>
                <th className="table-th">Gross</th>
                <th className="table-th">Deductions</th>
                <th className="table-th">Net</th>
                <th className="table-th">Effective</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {structures?.length === 0 && (
                <tr><td colSpan={7}><EmptyState title="No salary structures" message="Create one to start payroll." icon={<IndianRupee className="w-6 h-6" />} /></td></tr>
              )}
              {structures?.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="table-td">
                    <p className="font-medium">{s.user?.firstName} {s.user?.lastName}</p>
                    <p className="text-xs text-slate-400">{s.user?.employeeId}</p>
                  </td>
                  <td className="table-td">{formatINR(s.basicSalary)}</td>
                  <td className="table-td font-semibold">{formatINR(s.grossSalary)}</td>
                  <td className="table-td text-red-500">{formatINR(s.totalDeductions)}</td>
                  <td className="table-td font-bold text-emerald-600">{formatINR(s.netSalary)}</td>
                  <td className="table-td text-xs">{new Date(s.effectiveFrom).toLocaleDateString('en-IN')}</td>
                  <td className="table-td">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Salary Structure' : 'Create Salary Structure'} size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}><SaveIcon /> Save Structure</Button></>}>
        <div className="space-y-4">
          {!editing && (
            <Select label="Employee" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">Select employee...</option>
              {employees?.filter((e) => e.role !== 'HR_ADMIN').map((e) => <option key={e._id} value={e._id}>{e.fullName} ({e.employeeId})</option>)}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Basic Salary (₹) *" type="number" min="0" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
            <Input label="Effective From" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
          </div>
          <div>
            <p className="label">Earnings</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMPONENTS.slice(0, 8).map(([k, label]) => (
                <Input key={k} label={label} type="number" min="0" value={form[k] || 0} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              ))}
            </div>
          </div>
          <div>
            <p className="label">Deductions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COMPONENTS.slice(8).map(([k, label]) => (
                <Input key={k} label={label} type="number" min="0" value={form[k] || 0} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <p className="text-xs text-slate-400">Gross</p>
              <p className="font-bold text-brand-600">{formatINR(gross())}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
              <p className="text-xs text-slate-400">Deductions</p>
              <p className="font-bold text-red-500">{formatINR(deductions())}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <p className="text-xs text-slate-400">Net</p>
              <p className="font-bold text-emerald-600">{formatINR(gross() - deductions())}</p>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Deactivate structure?" message="This salary structure will be deactivated and no longer used in payroll." confirmText="Deactivate" />
    </div>
  );
}

const SaveIcon = () => <IndianRupee className="w-4 h-4" />;
