import React, { useState } from 'react';
import { AlarmClock, Plus, Pencil, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDate } from '../../utils/format';

export default function AdminHolidays() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'PUBLIC', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/holidays', { params: { year: new Date().getFullYear() } });
      setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load holidays', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', date: '', type: 'PUBLIC', description: '' }); setOpen(true); };
  const openEdit = (h) => { setEditing(h); setForm({ name: h.name, date: h.date.slice(0, 10), type: h.type, description: h.description || '' }); setOpen(true); };

  const submit = async () => {
    if (!form.name || !form.date) return toast.warning('Missing fields', 'Name and date are required.');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/holidays/${editing._id}`, form);
        toast.success('Holiday updated');
      } else {
        await api.post('/holidays', form);
        toast.success('Holiday added');
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
      await api.delete(`/holidays/${deleting._id}`);
      toast.success('Holiday removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading holidays..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Holiday Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{list?.length || 0} holidays this year</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Holiday</Button>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No holidays" message="Add company and public holidays." icon={<AlarmClock className="w-6 h-6" />} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list?.map((h) => (
            <Card key={h._id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300">
                  <AlarmClock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{h.name}</p>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleting(h)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-sky-600 dark:text-sky-300 mt-1">{formatDate(h.date)}</p>
                  <span className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{h.type}</span>
                  {h.description && <p className="text-xs text-slate-400 mt-2">{h.description}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? 'Save' : 'Add Holiday'}</Button></>}>
        <div className="space-y-4">
          <Input label="Holiday Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PUBLIC">Public</option>
              <option value="COMPANY">Company</option>
              <option value="OPTIONAL">Optional</option>
            </Select>
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Remove holiday?" message={`${deleting?.name} will be removed from the calendar.`} confirmText="Remove" />
    </div>
  );
}
