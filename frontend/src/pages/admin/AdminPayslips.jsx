import React, { useState } from 'react';
import { Wallet, Download, Eye } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Pagination';
import { formatINR, monthOptions, yearOptions } from '../../utils/format';

export default function AdminPayslips() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/payslips/all', { params: { month, year, page, limit: 20 } });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load payslips', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, [month, year]);

  const download = async (id) => {
    try {
      const res = await api.get(`/payslips/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed', getErrorMessage(err));
    }
  };

  if (loading && !data) return <PageLoader label="Loading payslips..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payslips</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data?.pagination?.total || 0} payslips generated</p>
        </div>
        <div className="flex gap-3">
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-36">
            {monthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
            {yearOptions().map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </Select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="table-th">Employee</th>
                <th className="table-th">Period</th>
                <th className="table-th">Gross</th>
                <th className="table-th">Deductions</th>
                <th className="table-th">Net Pay</th>
                <th className="table-th">Attendance</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.data?.length === 0 && (
                <tr><td colSpan={8}><EmptyState title="No payslips for this period" message="Run payroll from the Payroll page." icon={<Wallet className="w-6 h-6" />} /></td></tr>
              )}
              {data?.data?.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="table-td">
                    <p className="font-medium">{p.user?.firstName} {p.user?.lastName}</p>
                    <p className="text-xs text-slate-400">{p.user?.employeeId}</p>
                  </td>
                  <td className="table-td">{p.month}/{p.year}</td>
                  <td className="table-td">{formatINR(p.earnings.grossSalary)}</td>
                  <td className="table-td text-red-500">{formatINR(p.deductions.totalDeductions)}</td>
                  <td className="table-td font-bold text-emerald-600">{formatINR(p.netSalary)}</td>
                  <td className="table-td text-xs">
                    {p.attendanceSummary.presentDays}P · {p.attendanceSummary.absentDays}A
                  </td>
                  <td className="table-td"><Badge value={p.status} /></td>
                  <td className="table-td">
                    <Button variant="ghost" size="sm" onClick={() => download(p._id)}><Download className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={data?.pagination} onPage={load} />
      </Card>
    </div>
  );
}
