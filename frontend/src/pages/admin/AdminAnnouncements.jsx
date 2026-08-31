import React, { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Pin } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea, Checkbox } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { timeAgo } from '../../utils/format';

export default function AdminAnnouncements() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'NORMAL', pinned: false, expiresAt: '' });
  const [attachment, setAttachment] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements');
      setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load announcements', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', priority: 'NORMAL', pinned: false, expiresAt: '' }); setAttachment(null); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ title: a.title, description: a.description, priority: a.priority, pinned: a.pinned, expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : '' }); setAttachment(null); setOpen(true); };

  const submit = async () => {
    if (!form.title || !form.description) return toast.warning('Missing fields', 'Title and description are required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('priority', form.priority);
      fd.append('pinned', form.pinned);
      if (form.expiresAt) fd.append('expiresAt', form.expiresAt);
      if (attachment) fd.append('attachment', attachment);
      if (editing) {
        await api.put(`/announcements/${editing._id}`, fd);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', fd);
        toast.success('Announcement published', 'All employees were notified.');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error('Failed to save', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/announcements/${deleting._id}`);
      toast.success('Announcement removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading announcements..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Publish company-wide notices.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Announcement</Button>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No announcements" message="Publish your first announcement." icon={<Megaphone className="w-6 h-6" />} /></Card>
      ) : (
        <div className="space-y-4">
          {list?.map((a) => (
            <Card key={a._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                      <Badge value={a.priority} />
                      {a.pinned && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Pin className="w-3 h-3" /> Pinned</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{timeAgo(a.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleting(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Announcement' : 'New Announcement'} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? 'Save Changes' : 'Publish'}</Button></>}>
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description *" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Input label="Expires (optional)" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <Checkbox label="Pin to top" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
          <div>
            <label className="label">Attachment (optional)</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 cursor-pointer hover:border-brand-400 text-sm text-slate-500">
              {attachment ? attachment.name : 'Upload attachment'}
              <input type="file" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Remove announcement?" message={`${deleting?.title} will be removed.`} confirmText="Remove" />
    </div>
  );
}
