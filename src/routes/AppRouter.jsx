import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import RequireAuth from './RequireAuth';
import RoleGuard from './RoleGuard';
import AppLayout from '../components/layout/AppLayout';

// Eagerly loaded (small)
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import UnauthorizedPage from '../components/UnauthorizedPage';

// Lazy loaded heavy pages
const UserDashboard = lazy(() => import('../features/dashboard/UserDashboard'));
const AdminDashboard = lazy(() => import('../features/dashboard/AdminDashboard'));
const ClientListPage = lazy(() => import('../features/clients/ClientListPage'));
const InvoiceListPage = lazy(() => import('../features/invoices/InvoiceListPage'));
const InvoiceCreatePage = lazy(() => import('../features/invoices/InvoiceCreatePage'));
const InvoiceDetailPage = lazy(() => import('../features/invoices/InvoiceDetailPage'));
const ArticleListPage = lazy(() => import('../features/articles/ArticleListPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const Loader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <CircularProgress />
  </Box>
);

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected layout wrapper */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* Shared — any authenticated user */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* USER (comptable) routes */}
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user', 'admin']}>
                <UserDashboard />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="clients"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user', 'admin']}>
                <ClientListPage />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="invoices"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user', 'admin']}>
                <InvoiceListPage />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="invoices/new"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user']}>
                <InvoiceCreatePage />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="invoices/:id"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user', 'admin']}>
                <InvoiceDetailPage />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="invoices/:id/edit"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['user']}>
                <InvoiceCreatePage />
              </RoleGuard>
            </Suspense>
          }
        />

        {/* ADMIN-only routes */}
        <Route
          path="admin/dashboard"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['admin']}>
                <AdminDashboard />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="admin/articles"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['admin']}>
                <ArticleListPage />
              </RoleGuard>
            </Suspense>
          }
        />
        <Route
          path="admin/settings"
          element={
            <Suspense fallback={<Loader />}>
              <RoleGuard roles={['admin']}>
                <SettingsPage />
              </RoleGuard>
            </Suspense>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
