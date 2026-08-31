import React, { useState } from 'react';
import { Target, Star, Plus, Save } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate, toTitleCase } from '../../utils/format';

const RATING_FIELDS = [
  ['technicalSkills', 'Technical Skills'],
  ['communication', 'Communication'],
  ['teamwork', 'Teamwork'],
  ['initiative', 'Initiative'],
  ['punctuality', 'Punctuality'],
];

export default function ManagerPerformance({ admin }) {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    period: new Date().getFullYear() + ' Q' + (Math.ceil((new Date().getMonth() + 1) / 3)),
    goals: [{ title: '', description: '', weight: 50, status: 'IN_PROGRESS' }],
    ratings: { technicalSkills: '', communication: '', teamwork: '', initiative: '', punctuality: '' },
    strengths: '',
    improvements: '',
    managerComments: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([
        api.get('/performance'),
        api.get('/employees', { params: { limit: 100, role: 'EMPLOYEE' } }),
      ]);
      setList(r.data.data);
      setEmployees(e.data.data || []);
    } catch (err) {
      toast.error('Failed to load', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.userId) return toast.warning('Select employee', 'Please choose an employee.');
    setSaving(true);
    try {
      await api.post('/performance', {
        ...form,
        goals: form.goals.filter((g) => g.title.trim()),
        ratings: {
          ...form.ratings,
          technicalSkills: form.ratings.technicalSkills ? Number(form.ratings.technicalSkills) : undefined,
          communication: form.ratings.communication ? Number(form.ratings.communication) : undefined,
          teamwork: form.ratings.teamwork ? Number(form.ratings.teamwork) : undefined,
          initiative: form.ratings.initiative ? Number(form.ratings.initiative) : undefined,
          punctuality: form.ratings.punctuality ? Number(form.ratings.punctuality) : undefined,
        },
      });
      toast.success('Review created', 'The employee has been notified.');
      setOpen(false);
      load();
    } catch (err) {
      toast.error('Failed to create review', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading performance reviews..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Performance Reviews</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create goals and ratings for your team members.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> New Review</Button>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No reviews yet" message="Create your first performance review." icon={<Target className="w-6 h-6" />} /></Card>
      ) : (
        <div className="space-y-4">
          {list?.map((r) => (
            <Card key={r._id} className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{r.user?.firstName} {r.user?.lastName} — {r.period}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.user?.employeeId} · {formatDate(r.reviewDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.ratings?.overallRating && (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500"><Star className="w-4 h-4" /> {r.ratings.overallRating}/5</span>
                  )}
                  <Badge value={r.status} />
                </div>
              </div>
              <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Goals ({r.goals?.length || 0})</p>
                  <div className="space-y-1.5">
                    {r.goals?.map((g, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300">
                        <span className="truncate">{g.title}</span>
                        <Badge value={g.status} className="shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Feedback</p>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3">{r.managerComments || 'No comments yet.'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Performance Review" size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}><Save className="w-4 h-4" /> Create Review</Button></>}>
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Employee" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select employee...</option>
              {(employees || []).filter((e) => e.role === 'EMPLOYEE').map((e) => (
                <option key={e._id} value={e._id}>{e.fullName} ({e.employeeId})</option>
              ))}
            </Select>
            <Input label="Review Period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Q3 2026" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label !mb-0">Goals</p>
              <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, goals: [...form.goals, { title: '', description: '', weight: 10, status: 'NOT_STARTED' }] })}>+ Add goal</Button>
            </div>
            <div className="space-y-2">
              {form.goals.map((g, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_120px_auto] gap-2 items-center">
                  <input className="input" placeholder="Goal title" value={g.title} onChange={(e) => setForm({ ...form, goals: form.goals.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  <input className="input" type="number" min="0" max="100" placeholder="Weight" value={g.weight} onChange={(e) => setForm({ ...form, goals: form.goals.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} />
                  <Select value={g.status} onChange={(e) => setForm({ ...form, goals: form.goals.map((x, j) => (j === i ? { ...x, status: e.target.value } : x)) })}>
                    {['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'NOT_ACHIEVED'].map((s) => <option key={s} value={s}>{toTitleCase(s)}</option>)}
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, goals: form.goals.filter((_, j) => j !== i) })}>×</Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Ratings (1–5)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {RATING_FIELDS.map(([key, label]) => (
                <Input key={key} label={label} type="number" min="1" max="5" step="0.5" value={form.ratings[key] || ''} onChange={(e) => setForm({ ...form, ratings: { ...form.ratings, [key]: e.target.value } })} />
              ))}
            </div>
          </div>

          <Textarea label="Strengths" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
          <Textarea label="Areas to Improve" value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} />
          <Textarea label="Manager Comments" value={form.managerComments} onChange={(e) => setForm({ ...form, managerComments: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
