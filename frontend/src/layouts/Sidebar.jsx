import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, User, IdCard, CalendarCheck2, CalendarOff, Wallet, FileText,
  ReceiptText, Target, Bell, Megaphone, Users, Building2, IndianRupee, Sun,
  Moon, UsersRound, CheckSquare, Landmark, AlarmClock, Briefcase, X, KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from './NotificationProvider';
import { initials } from '../utils/format';

const nav = {
  employee: [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { to: '/attendance', label: 'Attendance', icon: <CalendarCheck2 className="w-[18px] h-[18px]" /> },
    { to: '/leaves', label: 'Leave Management', icon: <CalendarOff className="w-[18px] h-[18px]" /> },
    { to: '/payslips', label: 'Payslips', icon: <FileText className="w-[18px] h-[18px]" /> },
    { to: '/expenses', label: 'Expenses', icon: <ReceiptText className="w-[18px] h-[18px]" /> },
    { to: '/performance', label: 'Performance', icon: <Target className="w-[18px] h-[18px]" /> },
    { to: '/digital-id', label: 'Digital ID Card', icon: <IdCard className="w-[18px] h-[18px]" /> },
    { to: '/documents', label: 'Documents', icon: <Briefcase className="w-[18px] h-[18px]" /> },
    { to: '/announcements', label: 'Announcements', icon: <Megaphone className="w-[18px] h-[18px]" /> },
  ],
  manager: [
    { to: '/manager', label: 'Team Dashboard', icon: <UsersRound className="w-[18px] h-[18px]" /> },
    { to: '/manager/team', label: 'My Team', icon: <Users className="w-[18px] h-[18px]" /> },
    { to: '/manager/leave-approvals', label: 'Leave Approvals', icon: <CheckSquare className="w-[18px] h-[18px]" /> },
    { to: '/manager/expenses', label: 'Expense Approvals', icon: <ReceiptText className="w-[18px] h-[18px]" /> },
    { to: '/manager/performance', label: 'Team Performance', icon: <Target className="w-[18px] h-[18px]" /> },
  ],
  admin: [
    { to: '/admin', label: 'Analytics', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { to: '/admin/employees', label: 'Employees', icon: <Users className="w-[18px] h-[18px]" /> },
    { to: '/admin/departments', label: 'Departments', icon: <Building2 className="w-[18px] h-[18px]" /> },
    { to: '/admin/payroll', label: 'Payroll & Salary', icon: <IndianRupee className="w-[18px] h-[18px]" /> },
    { to: '/admin/payslips', label: 'Payslips', icon: <Wallet className="w-[18px] h-[18px]" /> },
    { to: '/admin/leaves', label: 'Leave Requests', icon: <CalendarOff className="w-[18px] h-[18px]" /> },
    { to: '/admin/expenses', label: 'Expense Claims', icon: <ReceiptText className="w-[18px] h-[18px]" /> },
    { to: '/admin/performance', label: 'Performance', icon: <Target className="w-[18px] h-[18px]" /> },
    { to: '/admin/holidays', label: 'Holidays', icon: <AlarmClock className="w-[18px] h-[18px]" /> },
    { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone className="w-[18px] h-[18px]" /> },
    { to: '/admin/documents', label: 'Documents', icon: <Briefcase className="w-[18px] h-[18px]" /> },
  ],
  common: [
    { to: '/profile', label: 'My Profile', icon: <User className="w-[18px] h-[18px]" /> },
    { to: '/notifications', label: 'Notifications', icon: <Bell className="w-[18px] h-[18px]" /> },
    { to: '/change-password', label: 'Change Password', icon: <KeyRound className="w-[18px] h-[18px]" /> },
  ],
};

const NavItem = ({ item, onNavigate }) => (
  <NavLink
    to={item.to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        isActive
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`
    }
  >
    {item.icon}
    {item.label}
  </NavLink>
);

export default function Sidebar({ mobile, onNavigate }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const { unread } = useNotifications();
  const groups = [];
  if (user) {
    if (user.role === 'HR_ADMIN') groups.push({ title: 'Admin', items: nav.admin });
    if (user.role === 'MANAGER') groups.push({ title: 'Manager', items: nav.manager });
    groups.push({ title: 'My Workspace', items: nav.employee });
    groups.push({ title: 'Account', items: nav.common });
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-sky-500 flex items-center justify-center text-white font-bold">
            N
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">Nexus Corp</p>
            <p className="text-[11px] text-slate-400">Employee Portal</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onNavigate} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {g.title}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            {dark ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />} Dark mode
          </span>
          <span className={`w-8 h-4.5 rounded-full p-0.5 transition ${dark ? 'bg-brand-600' : 'bg-slate-300'}`}>
            <span className={`block w-3.5 h-3.5 rounded-full bg-white transition ${dark ? 'ml-auto' : ''}`} />
          </span>
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate">
                {user.role === 'HR_ADMIN' ? 'HR Admin' : user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                {unread > 0 && ` Â· ${unread} unread`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
