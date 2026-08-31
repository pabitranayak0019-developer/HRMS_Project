import React, { useState } from 'react';
import { Target, Star, MessageSquareText, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, toTitleCase } from '../../utils/format';

const RatingBar = ({ label, value }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-slate-500 dark:text-slate-400 w-32">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-brand-500 to-sky-400 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
    </div>
    <span className="text-sm font-bold w-8 text-right">{value || '—'}</span>
  </div>
);

export default function Performance() {
  const toast = useToast();
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    api.get('/performance/me').then((res) => setReviews(res.data.data)).catch((err) => toast.error('Failed to load reviews', getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading performance reviews..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Performance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Goals, ratings and feedback from your manager.</p>
      </div>

      {reviews?.length === 0 ? (
        <Card><EmptyState title="No reviews yet" message="Your manager will create performance reviews for you." icon={<Target className="w-6 h-6" />} /></Card>
      ) : (
        <div className="space-y-6">
          {reviews?.map((r) => (
            <Card key={r._id}>
              <CardHeader
                title={`Review — ${r.period}`}
                subtitle={`Reviewed by ${r.manager?.firstName} ${r.manager?.lastName || ''} · ${formatDate(r.reviewDate)}`}
                icon={<Star className="w-5 h-5" />}
                action={<Badge value={r.status} />}
              />
              <div className="px-5 pb-5 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-brand-500" /> Goals</p>
                    <div className="space-y-2">
                      {r.goals?.length === 0 && <p className="text-sm text-slate-400">No goals set.</p>}
                      {r.goals?.map((g, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{g.title}</p>
                            <Badge value={g.status} />
                          </div>
                          {g.description && <p className="text-xs text-slate-400 mt-1">{g.description}</p>}
                          <p className="text-[11px] text-slate-400 mt-1">Weight: {g.weight}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Ratings</p>
                    <div className="space-y-3">
                      <RatingBar label="Technical Skills" value={r.ratings?.technicalSkills} />
                      <RatingBar label="Communication" value={r.ratings?.communication} />
                      <RatingBar label="Teamwork" value={r.ratings?.teamwork} />
                      <RatingBar label="Initiative" value={r.ratings?.initiative} />
                      <RatingBar label="Punctuality" value={r.ratings?.punctuality} />
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <RatingBar label="Overall" value={r.ratings?.overallRating} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10">
                    <p className="text-xs font-semibold uppercase text-emerald-600 mb-1">Strengths</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{r.strengths || '—'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                    <p className="text-xs font-semibold uppercase text-amber-600 mb-1">Areas to Improve</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{r.improvements || '—'}</p>
                  </div>
                </div>
                {r.managerComments && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-start gap-3">
                    <MessageSquareText className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Manager Feedback</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{r.managerComments}</p>
                    </div>
                  </div>
                )}
                {r.status !== 'COMPLETED' && (
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/performance/${r._id}`, { status: 'ACKNOWLEDGED' });
                          toast.success('Review acknowledged');
                          const res = await api.get('/performance/me');
                          setReviews(res.data.data);
                        } catch (err) {
                          toast.error('Failed', getErrorMessage(err));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Acknowledge review
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
