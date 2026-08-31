import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NotificationsProvider } from './NotificationProvider';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <Sidebar />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72">
              <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            <Outlet />
          </main>
          <footer className="px-6 py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
            © 2026 Nexus Corp Ltd · Corporate Employee Management Portal · BTech Major Project
          </footer>
        </div>
      </div>
    </NotificationsProvider>
  );
}
