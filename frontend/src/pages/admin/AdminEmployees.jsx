import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, UserPlus, Power, Camera, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage, uploadUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { Badge, RoleBadge } from '../../components/ui/Badge';
import { PageLoader, EmptyState, Skeleton } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate, initials, toTitleCase } from '../../utils/format';

export default function AdminEmployees() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('search') || '');
  const [filters, setFilters] = useState({ department: '', status: '', role: '' });
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankForm());

  function blankForm() {
    return {
      firstName: '', lastName: '', email: '', role: 'EMPLOYEE', department: '', manager: '',
      designation: '', joiningDate: '', gender: 'OTHER', phone: '', bloodGroup: '',
      employmentType: 'FULL_TIME', employmentStatus: 'ACTIVE', basicSalary: '',
    };
  }

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const q = { page, limit: 10 };
      if (search) q.search = search;
      if (filters.department) q.department = filters.department;
      if (filters.status) q.status = filters.status;
      if (filters.role) q.role = filters.role;
      const res = await api.get('/employees', { params: q });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load employees', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data.data)).catch(() => {});
    api.get('/employees/managers').then((res) => setManagers(res.data.data)).catch(() => {});
  }, []);

  React.useEffect(() => {
    load();
  }, [search, filters]);

  const submitCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email) return toast.warning('Missing fields', 'First name, last name and email are required.');
    setSaving(true);
    try {
      const payload = { ...form, basicSalary: form.basicSalary ? Number(form.basicSalary) : undefined, salary: form.basicSalary ? { basicSalary: Number(form.basicSalary) } : undefined };
      const res = await api.post('/employees', payload);
      toast.success('Employee created', `${res.data.user.fullName} (${res.data.user.employeeId}) · default password Welcome@123`);
      setOpenCreate(false);
      setForm(blankForm());
      load();
    } catch (err) {
      toast.error('Creation failed', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (emp) => {
    setEditing(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email, role: emp.role,
      department: emp.department?._id || '', manager: emp.manager?._id || '',
      designation: emp.profile?.designation || '', joiningDate: emp.profile?.joiningDate?.slice(0, 10) || '',
      gender: emp.profile?.gender || 'OTHER', phone: emp.profile?.phone || '', bloodGroup: emp.profile?.bloodGroup || '',
      employmentType: emp.profile?.employmentType || 'FULL_TIME', employmentStatus: emp.profile?.employmentStatus || 'ACTIVE', basicSalary: '',
    });
    setOpenEdit(true);
  };

  const submitEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/employees/${editing._id}`, form);
      toast.success('Employee updated');
      setOpenEdit(false);
      load();
    } catch (err) {
      toast.error('Update failed', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (emp) => {
    try {
      const status = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/employees/${emp._id}/status`, { status });
      toast.success(`Status set to ${status}`);
      load();
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/employees/${deleting._id}`);
      toast.success('Employee deactivated');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error('Delete failed', getErrorMessage(err));
    }
  };

  const uploadPhoto = async (emp, file) => {
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await api.post(`/employees/${emp._id}/photo`, fd);
      toast.success('Photo uploaded');
      load();
    } catch (err) {
      toast.error('Upload failed', getErrorMessage(err));
    }
  };

  const viewEmployee = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp._id}`);
      setViewing(res.data.data);
      setOpenView(true);
    } catch (err) {
      toast.error('Failed to load employee', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Employee Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{data?.pagination?.total || 0} employees</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}><UserPlus className="w-4 h-4" /> Add Employee</Button>
      </div>

      <Card>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              className="input !pl-9"
              placeholder="Search by name, email or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Select>
          <Select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="HR_ADMIN">HR Admin</option>
          </Select>
          <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-t border-slate-200 dark:border-slate-800">
                <th className="table-th">Employee</th>
                <th className="table-th">Employee ID</th>
                <th className="table-th">Department</th>
                <th className="table-th">Designation</th>
                <th className="table-th">Manager</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-6" /></td></tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={7}><EmptyState title="No employees found" message="Try adjusting your search or filters." icon={<Users className="w-6 h-6" />} /></td></tr>
              ) : (
                data?.data?.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                          {emp.profile?.photo ? <img src={uploadUrl(emp.profile.photo)} className="w-full h-full object-cover" alt="" /> : initials(emp.fullName)}
                        </div>
                        <div>
                          <p className="font-medium">{emp.fullName}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-mono text-xs">{emp.employeeId}</td>
                    <td className="table-td">{emp.department?.name || '—'}</td>
                    <td className="table-td">{emp.profile?.designation || '—'}</td>
                    <td className="table-td">{emp.manager?.firstName || '—'}</td>
                    <td className="table-td"><Badge value={emp.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewEmployee(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => toggleStatus(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800" title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}><Power className="w-4 h-4" /></button>
                        <button onClick={() => setDeleting(emp)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={data?.pagination} onPage={load} />
      </Card>

      {/* Create modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Add Employee" subtitle="Creates a login account and employee profile. Default password: Welcome@123" size="lg" footer={<><Button variant="secondary" onClick={() => setOpenCreate(false)}>Cancel</Button><Button onClick={submitCreate} loading={saving}>Create Employee</Button></>}>
        <EmployeeForm form={form} setForm={setForm} departments={departments} managers={managers} />
      </Modal>

      {/* Edit modal */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title={`Edit — ${editing?.fullName || ''}`} size="lg" footer={<><Button variant="secondary" onClick={() => setOpenEdit(false)}>Cancel</Button><Button onClick={submitEdit} loading={saving}>Save Changes</Button></>}>
        <EmployeeForm form={form} setForm={setForm} departments={departments} managers={managers} />
      </Modal>

      {/* View modal */}
      <Modal open={openView} onClose={() => setOpenView(false)} title={`Employee Details`} size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center text-xl font-bold overflow-hidden">
                {viewing.profile?.photo ? <img src={uploadUrl(viewing.profile.photo)} className="w-full h-full object-cover" alt="" /> : initials(viewing.fullName)}
              </div>
              <div>
                <p className="text-lg font-bold">{viewing.fullName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={viewing.role} />
                  <Badge value={viewing.status} />
                </div>
                <p className="text-sm text-slate-400 mt-1">{viewing.email}</p>
              </div>
              <label className="ml-auto btn-secondary !py-1.5 !text-xs">
                <Camera className="w-3.5 h-3.5" /> Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadPhoto(viewing, e.target.files[0]); }} />
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8">
              {[
                ['Employee ID', viewing.employeeId],
                ['Department', viewing.department?.name],
                ['Designation', viewing.profile?.designation],
                ['Manager', viewing.manager?.fullName],
                ['Phone', viewing.profile?.phone],
                ['Gender', toTitleCase(viewing.profile?.gender)],
                ['Joining Date', formatDate(viewing.profile?.joiningDate)],
                ['Employment', toTitleCase(viewing.profile?.employmentType)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-400">{k}</span>
                  <span className="text-sm font-medium">{v || '—'}</span>
                </div>
              ))}
            </div>
            {viewing.salaryStructure && (
              <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-600 mb-2">Current Salary Structure</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Basic: <b>{viewing.salaryStructure.basicSalary?.toLocaleString('en-IN')}</b></span>
                  <span>Gross: <b>{viewing.salaryStructure.grossSalary?.toLocaleString('en-IN')}</b></span>
                  <span>Net: <b>{viewing.salaryStructure.netSalary?.toLocaleString('en-IN')}</b></span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Deactivate employee?" message={`${deleting?.fullName} will be deactivated and unable to login. Their data is preserved.`} confirmText="Deactivate" />
    </div>
  );
}

function EmployeeForm({ form, setForm, departments, managers }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="First Name *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <Input label="Last Name *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR_ADMIN">HR Admin</option>
        </Select>
        <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
          <option value="">Select department...</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </Select>
        <Select label="Manager" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}>
          <option value="">No manager</option>
          {managers.map((m) => <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.role})</option>)}
        </Select>
        <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
        <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
        <Select label="Employment Type" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
          {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'PROBATION'].map((t) => <option key={t} value={t}>{toTitleCase(t)}</option>)}
        </Select>
        <Input label="Basic Salary (₹, optional)" type="number" min="0" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
      </div>
    </div>
  );
}
