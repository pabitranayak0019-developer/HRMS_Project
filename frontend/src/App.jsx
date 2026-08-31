import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { PageLoader } from './components/ui/Feedback';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyId from './pages/VerifyId';
import NotFound from './pages/NotFound';

import DashboardLayout from './layouts/DashboardLayout';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import Profile from './pages/common/Profile';
import DigitalId from './pages/common/DigitalId';
import Attendance from './pages/common/Attendance';
import Leaves from './pages/employee/Leaves';
import Payslips from './pages/common/Payslips';
import Documents from './pages/common/Documents';
import Expenses from './pages/employee/Expenses';
import Performance from './pages/common/Performance';
import Notifications from './pages/common/Notifications';
import Announcements from './pages/common/Announcements';
import ChangePassword from './pages/common/ChangePassword';

import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerTeam from './pages/manager/ManagerTeam';
import ManagerLeaveApprovals from './pages/manager/ManagerLeaveApprovals';
import ManagerExpenses from './pages/manager/ManagerExpenses';
import ManagerPerformance from './pages/manager/ManagerPerformance';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminPayroll from './pages/admin/AdminPayroll';
import AdminPayslips from './pages/admin/AdminPayslips';
import AdminHolidays from './pages/admin/AdminHolidays';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminLeaveApprovals from './pages/admin/AdminLeaveApprovals';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminPerformance from './pages/admin/AdminPerformance';

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HR_ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify/:id" element={<VerifyId />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/digital-id" element={<DigitalId />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leaves" element={<Leaves />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/change-password" element={<ChangePassword />} />

        <Route
          path="/manager"
          element={
            <RoleRoute roles={['MANAGER', 'HR_ADMIN']}>
              <ManagerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/team"
          element={
            <RoleRoute roles={['MANAGER', 'HR_ADMIN']}>
              <ManagerTeam />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/leave-approvals"
          element={
            <RoleRoute roles={['MANAGER', 'HR_ADMIN']}>
              <ManagerLeaveApprovals />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/expenses"
          element={
            <RoleRoute roles={['MANAGER', 'HR_ADMIN']}>
              <ManagerExpenses />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/performance"
          element={
            <RoleRoute roles={['MANAGER', 'HR_ADMIN']}>
              <ManagerPerformance />
            </RoleRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleRoute roles={['HR_ADMIN']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route path="/admin/employees" element={<RoleRoute roles={['HR_ADMIN']}><AdminEmployees /></RoleRoute>} />
        <Route path="/admin/departments" element={<RoleRoute roles={['HR_ADMIN']}><AdminDepartments /></RoleRoute>} />
        <Route path="/admin/payroll" element={<RoleRoute roles={['HR_ADMIN']}><AdminPayroll /></RoleRoute>} />
        <Route path="/admin/payslips" element={<RoleRoute roles={['HR_ADMIN']}><AdminPayslips /></RoleRoute>} />
        <Route path="/admin/holidays" element={<RoleRoute roles={['HR_ADMIN']}><AdminHolidays /></RoleRoute>} />
        <Route path="/admin/announcements" element={<RoleRoute roles={['HR_ADMIN']}><AdminAnnouncements /></RoleRoute>} />
        <Route path="/admin/documents" element={<RoleRoute roles={['HR_ADMIN']}><AdminDocuments /></RoleRoute>} />
        <Route path="/admin/leaves" element={<RoleRoute roles={['HR_ADMIN']}><AdminLeaveApprovals /></RoleRoute>} />
        <Route path="/admin/expenses" element={<RoleRoute roles={['HR_ADMIN']}><AdminExpenses /></RoleRoute>} />
        <Route path="/admin/performance" element={<RoleRoute roles={['HR_ADMIN']}><AdminPerformance /></RoleRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
