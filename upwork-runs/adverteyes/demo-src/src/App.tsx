import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AlertsProvider } from './contexts/AlertsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Analytics from './pages/Analytics';
import Weather from './pages/Weather';
import Users from './pages/Users';
import Reports from './pages/Reports';
import OpsSchedule from './pages/OpsSchedule';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/campaigns" replace />;
  return <Layout>{children}</Layout>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'client' ? '/campaigns' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
      <AlertsProvider>
      <BrowserRouter basename="/demos/adverteyes">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin', 'sales', 'ops']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute roles={['admin', 'sales', 'ops']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/campaigns" element={
            <ProtectedRoute roles={['admin', 'sales', 'client']}>
              <Campaigns />
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <Clients />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute roles={['admin', 'sales', 'ops']}>
              <Bookings />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/weather" element={
            <ProtectedRoute roles={['admin', 'sales', 'ops']}>
              <Weather />
            </ProtectedRoute>
          } />
          <Route path="/ops-schedule" element={
            <ProtectedRoute roles={['admin', 'ops']}>
              <OpsSchedule />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={['admin', 'sales']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AlertsProvider>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}
