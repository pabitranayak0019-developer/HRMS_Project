import React, { useState } from 'react';
import { Megaphone, Pin, PinOff } from 'lucide-react';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { timeAgo } from '../../utils/format';

export default function Announcements() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    api.get('/announcements').then((res) => setItems(res.data.data)).catch((err) => toast.error('Failed to load', getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Company-wide notices and updates.</p>
      </div>

      {items?.length === 0 ? (
        <Card><EmptyState title="No announcements" message="Check back later for company updates." icon={<Megaphone className="w-6 h-6" />} /></Card>
      ) : (
        <div className="space-y-4">
          {items?.map((a) => (
            <Card key={a._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2.5 rounded-lg ${a.priority === 'URGENT' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'}`}>
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                      <Badge value={a.priority} />
                      {a.pinned && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Pin className="w-3 h-3" /> Pinned</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 whitespace-pre-wrap">{a.description}</p>
                    <p className="text-[11px] text-slate-400 mt-3">
                      Posted by {a.createdBy?.firstName} {a.createdBy?.lastName || ''} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
                {a.attachment && (
                  <a href={uploadUrl(a.attachment)} target="_blank" rel="noreferrer" className="shrink-0 btn-secondary !py-1.5 !text-xs">
                    Attachment
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
