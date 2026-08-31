import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Image as ImageIcon, ShieldCheck, RefreshCw, Building2, CalendarDays, Droplets } from 'lucide-react';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Feedback';
import { formatDate, initials } from '../../utils/format';

export default function DigitalId() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, refetch } = useFetch('/idcard/me');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const cardRef = useRef(null);

  if (loading || !data) return <PageLoader label="Generating your ID card..." />;

  const c = data.data;

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/idcard/${user._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employee_id_${c.employeeId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error('Download failed', getErrorMessage(err));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadPng = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#f1f5f9' });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `employee_id_${c.employeeId}.png`;
      a.click();
      toast.success('Image downloaded');
    } catch (err) {
      toast.error('Capture failed', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Digital Employee ID</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Preview, download or verify your official identity card.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refetch}><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button variant="secondary" onClick={downloadPng}><ImageIcon className="w-4 h-4" /> Download Image</Button>
          <Button onClick={downloadPdf} loading={downloadingPdf}><Download className="w-4 h-4" /> Download PDF</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 flex justify-center">
          <div ref={cardRef} className="w-full max-w-[540px] relative rounded-2xl overflow-hidden shadow-pop bg-slate-100">
            <div className="h-3 bg-gradient-to-r from-brand-800 to-sky-500" />
            <div className="px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-sky-500 flex items-center justify-center text-white font-bold text-xl">
                  N
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-slate-900 leading-tight">Nexus Corp Ltd</p>
                  <p className="text-xs text-slate-500">Corporate Employee Management Portal</p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                      {c.photo ? <img src={uploadUrl(c.photo)} alt="" className="w-full h-full object-cover" /> : initials(c.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-700">EMPLOYEE IDENTITY CARD</p>
                      <p className="text-sm text-slate-400">{c.employeeId}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-xl text-slate-900">{c.fullName}</p>
                    <p className="text-sm text-slate-500">{c.designation}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs">
                      <span className="text-slate-400 font-medium uppercase">Department</span>
                      <span className="font-semibold text-slate-700 text-right">{c.department || '—'}</span>
                      <span className="text-slate-400 font-medium uppercase">Email</span>
                      <span className="font-semibold text-slate-700 text-right truncate">{c.email}</span>
                      <span className="text-slate-400 font-medium uppercase">Joining</span>
                      <span className="font-semibold text-slate-700 text-right">{formatDate(c.joiningDate)}</span>
                      <span className="text-slate-400 font-medium uppercase">Validity</span>
                      <span className="font-semibold text-slate-700 text-right">{formatDate(c.validity)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <QRCodeSVG value={c.token} size={110} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 w-[110px]">Scan to verify identity</p>
                </div>
              </div>
            </div>
            <div className="h-3 bg-gradient-to-r from-brand-800 to-sky-500" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">QR Verified Identity</p>
                <p className="text-xs text-slate-400">Scannable against the live verification endpoint</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Building2 className="w-4 h-4 mt-0.5 text-slate-400" />
                <span>The QR code contains an encrypted token linking to this employee's verified profile at the public <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">/api/idcard/verify/&lt;id&gt;</code> endpoint.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <CalendarDays className="w-4 h-4 mt-0.5 text-slate-400" />
                <span>Validity automatically set at onboarding; renewed by HR on request.</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Try the verification link</p>
            <a
              href={`/verify/${user._id}`}
              target="_blank"
              rel="noreferrer"
              className="w-full btn-secondary"
            >
              <ShieldCheck className="w-4 h-4" /> Open Verification Page
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
