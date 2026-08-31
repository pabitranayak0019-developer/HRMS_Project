import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, Search, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from './NotificationProvider';
import { initials, timeAgo } from '../utils/format';
import { Button } from '../components/ui/Button';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { notifications, unread, markAllRead, markRead } = useNotifications();
  const navigate = useNavigate();
  const [openProfile, setOpenProfile] = useState(false);
  const [openBell, setOpenBell] = useState(false);
  const profileRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpenBell(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel = user?.role === 'HR_ADMIN' ? 'HR Admin' : user?.role === 'MANAGER' ? 'Manager' : 'Employee';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <button onClick={onMenu} className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <div className="hidden sm:flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Quick search (employees, docs)..."
              className="input !pl-9 !bg-slate-50 dark:!bg-slate-800/50 !border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  if (user?.role === 'HR_ADMIN') navigate(`/admin/employees?search=${encodeURIComponent(e.target.value.trim())}`);
                  e.target.blur();
                }
              }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={toggle}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300"
        title="Toggle theme"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative" ref={bellRef}>
        <button
          onClick={() => setOpenBell((o) => !o)}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {openBell && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-pop border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
              <button onClick={markAllRead} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>}
              {notifications.slice(0, 12).map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    markRead(n._id);
                    setOpenBell(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex gap-3 ${!n.isRead ? 'bg-brand-50/60 dark:bg-brand-900/10' : ''}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-brand-500'}`} />
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setOpenBell(false);
                navigate('/notifications');
              }}
              className="w-full py-2.5 text-xs font-semibold text-brand-600 dark:text-brand-400 border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setOpenProfile((o) => !o)}
          className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-sky-500 text-white flex items-center justify-center text-sm font-bold">
            {initials(user?.fullName)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{user?.firstName}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
        </button>

        {openProfile && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-pop border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.employeeId}</p>
            </div>
            <div className="py-1">
              <button onClick={() => { setOpenProfile(false); navigate('/profile'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                <User className="w-4 h-4" /> My Profile
              </button>
              <button onClick={() => { setOpenProfile(false); navigate('/digital-id'); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Settings className="w-4 h-4" /> Digital ID
              </button>
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
