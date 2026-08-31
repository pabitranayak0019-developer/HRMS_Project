import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, hint, className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={`input ${error ? '!border-red-500' : ''}`} {...props} />
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <select ref={ref} className={`input ${error ? '!border-red-500' : ''}`} {...props}>
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';

export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} rows={3} className={`input resize-y ${error ? '!border-red-500' : ''}`} {...props} />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

export const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="label">{label}</label>
    {children}
  </div>
);

export const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer">
    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...props} />
    {label}
  </label>
);
