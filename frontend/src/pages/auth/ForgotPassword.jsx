import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.warning('Enter email', 'Please enter your registered email.');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-800 via-brand-700 to-sky-500">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-pop p-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
          {sent ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Check your inbox</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                If an account exists for <span className="font-medium">{email}</span>, a password reset link has been sent. It is valid for 30 minutes.
              </p>
              <p className="text-xs text-slate-400 mt-4">(In this demo, the reset link works without a mail server — use it from your backend logs.)</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reset your password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered email and we'll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button type="submit" className="w-full" loading={loading}>
                  <Send className="w-4 h-4" /> Send reset link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
