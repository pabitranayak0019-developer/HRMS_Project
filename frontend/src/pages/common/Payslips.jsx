import React, { useState } from 'react';
import { Wallet, Download, Eye } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { Badge } from '../../components/ui/Badge';
import { formatINR, formatDate } from '../../utils/format';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Payslips() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payslips/me', { params: { limit: 24 } });
      setList(res.data);
    } catch (err) {
      toast.error('Failed to load payslips', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const openSlip = async (id) => {
    try {
      const res = await api.get(`/payslips/${id}`);
      setSelected(res.data.data);
    } catch (err) {
      toast.error('Failed to load payslip', getErrorMessage(err));
    }
  };

  const download = async (id) => {
    setDownloading(true);
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch (err) {
      toast.error('Download failed', getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <PageLoader label="Loading payslips..." />;

  const earnings = selected?.earnings || {};
  const deductions = selected?.deductions || {};
  const att = selected?.attendanceSummary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Payslips</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and download your monthly salary slips.</p>
      </div>

      {list?.data?.length === 0 ? (
        <Card><EmptyState title="No payslips yet" message="Payslips appear after HR runs payroll for a month." icon={<Wallet className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list?.data?.map((p) => (
            <Card key={p._id} className="p-5 hover:shadow-pop transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{MONTH_NAMES[p.month - 1]} {p.year}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Net Payable</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">{formatINR(p.netSalary)}</p>
                </div>
                <Badge value={p.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Gross: <b className="text-slate-800 dark:text-slate-100">{formatINR(p.earnings.grossSalary)}</b></span>
                <span>Deductions: <b className="text-red-500">{formatINR(p.deductions.totalDeductions)}</b></span>
                <span>Present: <b className="text-slate-800 dark:text-slate-100">{att.presentDays}</b></span>
                <span>Absent: <b className="text-slate-800 dark:text-slate-100">{att.absentDays}</b></span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openSlip(p._id)}><Eye className="w-4 h-4" /> View</Button>
                <Button size="sm" className="flex-1" onClick={() => download(p._id)} loading={downloading}><Download className="w-4 h-4" /> PDF</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={`Payslip — ${MONTH_NAMES[(selected?.month || 1) - 1]} ${selected?.year}`} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl bg-gradient-to-r from-brand-700 to-sky-500 p-4 text-white flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">Nexus Corp Ltd</p>
                <p className="text-xs text-white/80">{user?.fullName} · {user?.employeeId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatINR(selected.netSalary)}</p>
                <p className="text-xs text-white/80">Net Payable</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  {[['Basic Salary', earnings.basicSalary], ['HRA', earnings.hra], ['Special Allowance', earnings.specialAllowance], ['Conveyance', earnings.conveyanceAllowance], ['Medical', earnings.medicalAllowance], ['Travel', earnings.travelAllowance], ['Bonus', earnings.bonus], ['Other Earnings', earnings.otherEarnings]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-medium">{formatINR(v)}</span></div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold"><span>Gross</span><span>{formatINR(earnings.grossSalary)}</span></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Deductions</p>
                <div className="space-y-1.5 text-sm">
                  {[['PF', deductions.pf], ['Professional Tax', deductions.professionalTax], ['Income Tax', deductions.incomeTax], ['Insurance', deductions.insuranceDeduction], ['Loan', deductions.loanDeduction], ['Other', deductions.otherDeductions], ['Unpaid Leave', selected.leaveDeduction]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-medium text-red-500">-{formatINR(v)}</span></div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold"><span>Total Deductions</span><span className="text-red-500">{formatINR(deductions.totalDeductions)}</span></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Attendance Summary</p>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                {[['Present', att.presentDays], ['Half', att.halfDays], ['Absent', att.absentDays], ['Paid Leave', att.paidLeaveDays], ['Unpaid Leave', att.unpaidLeaveDays], ['Holidays', att.holidays], ['Working', att.workingDays], ['Payable', selected.proratedDays]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2"><p className="font-bold">{v ?? 0}</p><p className="text-[11px] text-slate-400">{k}</p></div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => download(selected._id)} loading={downloading}><Download className="w-4 h-4" /> Download PDF</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
