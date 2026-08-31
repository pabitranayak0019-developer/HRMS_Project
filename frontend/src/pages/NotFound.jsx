import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
      <Compass className="w-14 h-14 text-brand-500 mb-4" />
      <h1 className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">404</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-2">The page you're looking for doesn't exist.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
