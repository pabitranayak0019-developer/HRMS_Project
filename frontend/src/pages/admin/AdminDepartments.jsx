import React, { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, Users } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Pagination';

export default function AdminDepartments() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load departments', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, code: d.code || '', description: d.description || '' }); setOpen(true); };

  const submit = async () => {
    if (!form.name) return toast.warning('Name required', 'Department name is required.');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/departments/${editing._id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
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
      await api.delete(`/departments/${deleting._id}`);
      toast.success('Department deactivated');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading departments..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{list?.length || 0} departments</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Department</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list?.map((d) => (
          <Card key={d._id} className="p-5 hover:shadow-pop transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{d.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{d.code || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setDeleting(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {d.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{d.description}</p>}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 text-slate-400" /> {d.employeeCount || 0} employees
              </span>
              <span className="text-xs text-slate-400">Head: {d.head ? `${d.head.firstName}` : '—'}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Department' : 'Add Department'} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Department Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ENG" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Deactivate department?" message={`${deleting?.name} will be deactivated. Departments with active employees cannot be deleted.`} confirmText="Deactivate" />
    </div>
  );
}
