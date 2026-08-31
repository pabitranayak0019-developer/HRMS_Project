import React, { useEffect, useState } from 'react';
import { Camera, Save, Pencil, Phone, Mail, MapPin, Building2, Briefcase, CalendarDays, Landmark, HeartPulse, Users } from 'lucide-react';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';
import { PageLoader, EmptyState } from '../../components/ui/Feedback';
import { Badge, RoleBadge } from '../../components/ui/Badge';
import { formatDate, toTitleCase, initials } from '../../utils/format';

const InfoRow = ({ label, value }) => (
  <div className="px-4 py-3 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 text-right">{value || '—'}</span>
  </div>
);

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const { data } = await api.get('/employees/me');
      setData(data.data);
      const p = data.data.profile || {};
      setForm({
        phone: p.phone || '',
        gender: p.gender || 'OTHER',
        dob: p.dob ? p.dob.slice(0, 10) : '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        country: p.country || '',
        pincode: p.pincode || '',
        bloodGroup: p.bloodGroup || '',
        education: p.education || '',
        skills: p.skills ? p.skills.join(', ') : '',
        bankAccountName: p.bank?.accountName || '',
        bankAccountNumber: p.bank?.accountNumber || '',
        bankIfsc: p.bank?.ifsc || '',
        bankName: p.bank?.bankName || '',
        bankBranch: p.bank?.branch || '',
        emergencyName: p.emergencyContact?.name || '',
        emergencyRelation: p.emergencyContact?.relation || '',
        emergencyPhone: p.emergencyContact?.phone || '',
      });
    } catch (err) {
      toast.error('Failed to load profile', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Invalid file', 'Please select an image.');
    const fd = new FormData();
    fd.append('photo', file);
    setUploading(true);
    try {
      const res = await api.post('/employees/me/photo', fd);
      toast.success('Photo updated');
      setData((d) => ({ ...d, profile: { ...d.profile, photo: res.data.photo } }));
      setUser((u) => ({ ...u }));
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/employees/me', {
        phone: form.phone,
        gender: form.gender,
        dob: form.dob || undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        country: form.country,
        pincode: form.pincode,
        bloodGroup: form.bloodGroup,
        education: form.education,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        bank: {
          accountName: form.bankAccountName,
          accountNumber: form.bankAccountNumber,
          ifsc: form.bankIfsc,
          bankName: form.bankName,
          branch: form.bankBranch,
        },
        emergencyContact: {
          name: form.emergencyName,
          relation: form.emergencyRelation,
          phone: form.emergencyPhone,
        },
      });
      toast.success('Profile saved', 'Your details have been updated.');
      setEditMode(false);
      load();
    } catch (err) {
      toast.error('Save failed', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading profile..." />;
  const p = data?.profile || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your personal and professional information.</p>
        </div>
        {!editMode && (
          <Button onClick={() => setEditMode(true)}>
            <Pencil className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center text-3xl font-bold overflow-hidden">
                {p.photo ? <img src={uploadUrl(p.photo)} alt="profile" className="w-full h-full object-cover" /> : initials(data?.fullName)}
              </div>
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-600 text-white cursor-pointer hover:bg-brand-700 shadow-pop">
                {uploading ? (
                  <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
              </label>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4">{data?.fullName}</h2>
            <p className="text-sm text-slate-500">{p.designation || '—'}</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge value={user?.employeeId} label={user?.employeeId} />
              <RoleBadge role={user?.role} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Mail className="w-4 h-4 text-slate-400" /> {data?.email}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Phone className="w-4 h-4 text-slate-400" /> {p.phone || '—'}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Building2 className="w-4 h-4 text-slate-400" /> {data?.department?.name || '—'}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin className="w-4 h-4 text-slate-400" /> {[p.city, p.state].filter(Boolean).join(', ') || '—'}</div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Employment" icon={<Briefcase className="w-5 h-5" />} />
            <InfoRow label="Department" value={data?.department?.name} />
            <InfoRow label="Designation" value={p.designation} />
            <InfoRow label="Employee ID" value={data?.employeeId} />
            <InfoRow label="Joining Date" value={formatDate(p.joiningDate)} />
            <InfoRow label="Employment Type" value={toTitleCase(p.employmentType)} />
            <InfoRow label="Status" value={<Badge value={p.employmentStatus || user?.status} />} />
            <InfoRow label="Manager" value={data?.manager?.fullName || '—'} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {editMode ? (
            <form onSubmit={save} className="space-y-6">
              <Card>
                <CardHeader title="Personal Details" icon={<Users className="w-5 h-5" />} />
                <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
                  <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </Select>
                  <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                  <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} placeholder="e.g. B+" />
                  <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                  <Input label="Education" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
                  <div className="sm:col-span-2">
                    <Input label="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, MongoDB" />
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Bank Details" icon={<Landmark className="w-5 h-5" />} />
                <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
                  <Input label="Account Holder Name" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
                  <Input label="Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
                  <Input label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                  <Input label="IFSC Code" value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} />
                  <Input label="Branch" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Emergency Contact" icon={<HeartPulse className="w-5 h-5" />} />
                <div className="px-5 pb-5 grid sm:grid-cols-3 gap-4">
                  <Input label="Name" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
                  <Input label="Relation" value={form.emergencyRelation} onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })} />
                  <Input label="Phone" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
                </div>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </form>
          ) : (
            <>
              <Card>
                <CardHeader title="Personal Information" icon={<Users className="w-5 h-5" />} />
                <InfoRow label="Full Name" value={data?.fullName} />
                <InfoRow label="Email" value={data?.email} />
                <InfoRow label="Phone" value={p.phone} />
                <InfoRow label="Gender" value={toTitleCase(p.gender)} />
                <InfoRow label="Date of Birth" value={formatDate(p.dob)} />
                <InfoRow label="Blood Group" value={p.bloodGroup} />
                <InfoRow label="Address" value={[p.address, p.city, p.state, p.country, p.pincode].filter(Boolean).join(', ')} />
                <InfoRow label="Education" value={p.education} />
                <InfoRow label="Skills" value={p.skills?.join(', ')} />
              </Card>

              <Card>
                <CardHeader title="Bank & Payroll" icon={<Landmark className="w-5 h-5" />} />
                <InfoRow label="Account Holder" value={p.bank?.accountName} />
                <InfoRow label="Account Number" value={p.bank?.accountNumber ? `XXXX${String(p.bank.accountNumber).slice(-4)}` : '—'} />
                <InfoRow label="Bank" value={p.bank?.bankName} />
                <InfoRow label="IFSC" value={p.bank?.ifsc} />
                <InfoRow label="Branch" value={p.bank?.branch} />
              </Card>

              <Card>
                <CardHeader title="Emergency Contact" icon={<HeartPulse className="w-5 h-5" />} />
                <InfoRow label="Name" value={p.emergencyContact?.name} />
                <InfoRow label="Relation" value={p.emergencyContact?.relation} />
                <InfoRow label="Phone" value={p.emergencyContact?.phone} />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
