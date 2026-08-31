import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Building2, ShieldCheck, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Checkbox } from '../../components/ui/Form';

const DEMO_ACCOUNTS = [
  { role: 'HR Admin', id: 'hr@nexuscorp.example', badge: 'bg-violet-100 text-violet-700' },
  { role: 'Manager', id: 'manager@nexuscorp.example', badge: 'bg-sky-100 text-sky-700' },
  { role: 'Employee', id: 'employee@nexuscorp.example', badge: 'bg-emerald-100 text-emerald-700' },
];

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.warning('Missing details', 'Please enter your email/employee ID and password.');
      return;
    }
    setLoading(true);
    try {
      const u = await login(identifier, password, rememberMe);
      toast.success(`Welcome back, ${u.firstName}!`);
      window.location.href = '/';
    } catch (err) {
      toast.error('Login failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-brand-800 via-brand-700 to-sky-500">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 max-w-xl">
          <div className="flex items-center gap-3 text-white">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center font-bold text-lg">N</div>
            <div>
              <p className="text-lg font-bold leading-tight">Nexus Corp Ltd</p>
              <p className="text-xs text-white/70">Employee Management Portal</p>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Everything your workforce needs, in one place.
            </h1>
            <p className="mt-4 text-white/80 text-base">
              Attendance, leave, payroll, digital ID cards, appraisals and more — built for modern companies.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { icon: <Clock className="w-5 h-5" />, label: 'Attendance' },
                { icon: <Users className="w-5 h-5" />, label: 'Teams' },
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'Payroll' },
              ].map((f) => (
                <div key={f.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-white">
                  {f.icon}
                  <p className="text-sm font-semibold mt-2">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/50">© 2026 Nexus Corp Ltd. All rights reserved.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white">N</div>
            <p className="font-bold">Nexus Corp Ltd</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in to your account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use your employee email or employee ID.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email or Employee ID"
              placeholder="you@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Checkbox label="Remember me for 30 days" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <Button type="submit" className="w-full !py-2.5" loading={loading}>
              <LogIn className="w-4 h-4" /> Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">
              <Building2 className="w-4 h-4" /> Demo credentials (password: Welcome@123)
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => {
                    setIdentifier(d.id);
                    setPassword('Welcome@123');
                  }}
                  className="w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition"
                >
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${d.badge}`}>{d.role}</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{d.id}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Click an account to auto-fill, then press Sign in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
