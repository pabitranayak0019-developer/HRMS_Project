import React, { useState } from 'react';
import { FileText, Upload, Trash2, Download } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { formatDateTime, toTitleCase } from '../../utils/format';

const CATEGORIES = ['OFFER_LETTER', 'APPOINTMENT_LETTER', 'HR_POLICY', 'PAYSLIP', 'ID_CARD', 'OFFICIAL', 'CERTIFICATE', 'OTHER'];

export default function AdminDocuments() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'HR_POLICY', description: '', visibility: 'PUBLIC' });
  const [file, setFile] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setList(res.data.data);
    } catch (err) {
      toast.error('Failed to load documents', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.title || !file) return toast.warning('Missing', 'Title and file are required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('visibility', form.visibility);
      fd.append('file', file);
      await api.post('/documents', fd);
      toast.success('Document uploaded');
      setOpen(false);
      setForm({ title: '', category: 'HR_POLICY', description: '', visibility: 'PUBLIC' });
      setFile(null);
      load();
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/documents/${deleting._id}`);
      toast.success('Document removed');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader label="Loading documents..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Document Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{list?.length || 0} documents</p>
        </div>
        <Button onClick={() => setOpen(true)}><Upload className="w-4 h-4" /> Upload Document</Button>
      </div>

      {list?.length === 0 ? (
        <Card><EmptyState title="No documents" message="Upload policies, letters and official files." icon={<FileText className="w-6 h-6" />} /></Card>
      ) : (
        <Card>
          <CardHeader title="All Documents" icon={<FileText className="w-5 h-5" />} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-y border-slate-200 dark:border-slate-800">
                  <th className="table-th">Title</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Visibility</th>
                  <th className="table-th">Size</th>
                  <th className="table-th">Uploaded</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list?.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="table-td font-medium">{d.title}</td>
                    <td className="table-td">{toTitleCase(d.category)}</td>
                    <td className="table-td"><Badge value={d.visibility} label={toTitleCase(d.visibility)} /></td>
                    <td className="table-td text-xs">{(d.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="table-td text-xs">{formatDateTime(d.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex gap-1">
                        <a href={`/api/documents/${d._id}/download`} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Download className="w-4 h-4" /></a>
                        <button onClick={() => setDeleting(d)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}><Upload className="w-4 h-4" /> Upload</Button></>}>
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{toTitleCase(c)}</option>)}
          </Select>
          <Select label="Visibility" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            <option value="PUBLIC">Public — all employees</option>
            <option value="PRIVATE">Private — selected employees</option>
          </Select>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="label">File * (PDF, images, DOC, XLS, TXT, CSV — max 10MB)</label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-5 cursor-pointer hover:border-brand-400 text-sm text-slate-500">
              <FileText className="w-4 h-4" /> {file ? file.name : 'Choose file'}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Remove document?" message={`${deleting?.title} will no longer be accessible.`} confirmText="Remove" />
    </div>
  );
}
