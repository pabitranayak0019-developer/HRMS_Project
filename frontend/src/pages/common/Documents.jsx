import React, { useState } from 'react';
import { FileText, Download, FolderOpen, File } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, toTitleCase, formatDateTime } from '../../utils/format';

const CATEGORY_ICONS = {
  OFFER_LETTER: <FileText className="w-5 h-5" />,
  APPOINTMENT_LETTER: <FileText className="w-5 h-5" />,
  HR_POLICY: <FolderOpen className="w-5 h-5" />,
  PAYSLIP: <FileText className="w-5 h-5" />,
  ID_CARD: <File className="w-5 h-5" />,
  OFFICIAL: <File className="w-5 h-5" />,
  CERTIFICATE: <FileText className="w-5 h-5" />,
  OTHER: <File className="w-5 h-5" />,
};

export default function Documents() {
  const toast = useToast();
  const [docs, setDocs] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocs(res.data.data);
    } catch (err) {
      toast.error('Failed to load documents', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const download = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Download failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Document Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Company policies, offer letters and official documents.</p>
      </div>

      {docs?.length === 0 ? (
        <Card><EmptyState title="No documents" message="HR will upload documents here." icon={<FileText className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs?.map((d) => (
            <Card key={d._id} className="p-5 hover:shadow-pop transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
                  {CATEGORY_ICONS[d.category] || CATEGORY_ICONS.OTHER}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{d.title}</p>
                  <p className="text-xs text-slate-400">{toTitleCase(d.category).replace('Letter', 'Letter')}</p>
                </div>
              </div>
              {d.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{d.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{formatDateTime(d.createdAt)}</span>
                <button onClick={() => download(d)} className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
