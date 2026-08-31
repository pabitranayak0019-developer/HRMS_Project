import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, Building2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { PageLoader } from '../components/ui/Feedback';
import { formatDate } from '../utils/format';

export default function VerifyId() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, valid: null, data: null, message: '' });

  useEffect(() => {
    api
      .get(`/idcard/verify/${id}`)
      .then(({ data }) => setState({ loading: false, valid: data.valid, data: data.data, message: data.message }))
      .catch((err) => {
        const msg = getErrorMessage(err);
        setState({ loading: false, valid: false, data: null, message: msg });
      });
  }, [id]);

  if (state.loading) return <PageLoader label="Verifying employee identity..." />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 text-brand-700 dark:text-brand-300 mb-6">
          <Building2 className="w-5 h-5" />
          <span className="font-bold">Nexus Corp Ltd — Employee Verification</span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-pop p-8 text-center border border-slate-200 dark:border-slate-700">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
              state.valid ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' : 'bg-red-50 dark:bg-red-900/30 text-red-500'
            }`}
          >
            {state.valid ? <ShieldCheck className="w-8 h-8" /> : <ShieldX className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {state.valid ? 'Identity Verified' : 'Verification Failed'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{state.message}</p>

          {state.valid && state.data && (
            <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 text-left">
              {[
                ['Employee Name', state.data.name],
                ['Employee ID', state.data.employeeId],
                ['Department', state.data.department],
                ['Designation', state.data.designation],
                ['Joining Date', formatDate(state.data.joiningDate)],
                ['Verified At', new Date(state.data.verifiedAt).toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{k}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{v || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
