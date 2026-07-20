import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { RoleHomePage } from '../pages/RoleHomePage';
const AdminHomePage = lazy(() => import('../pages/admin/AdminHomePage').then((module) => ({ default: module.AdminHomePage })));
const BulkUserImportPage = lazy(() => import('../pages/admin/BulkUserImportPage').then((module) => ({ default: module.BulkUserImportPage })));
const UserFormPage = lazy(() => import('../pages/admin/UserFormPage').then((module) => ({ default: module.UserFormPage })));
const UsersAdminPage = lazy(() => import('../pages/admin/UsersAdminPage').then((module) => ({ default: module.UsersAdminPage })));

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<div className="p-8 text-[#000F9F]">Cargando módulo…</div>}>{page}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'recuperar-clave', element: <ForgotPasswordPage /> },
      { path: 'restablecer-clave', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowPasswordChange />,
    children: [
      { path: 'cambiar-clave', element: <ChangePasswordPage /> },
      { path: 'acceso-denegado', element: <AccessDeniedPage /> },
    ],
  },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(<AdminHomePage />) },
          { path: 'usuarios', element: lazyPage(<UsersAdminPage />) },
          { path: 'usuarios/nuevo', element: lazyPage(<UserFormPage />) },
          { path: 'usuarios/:id/editar', element: lazyPage(<UserFormPage />) },
          { path: 'usuarios/importar', element: lazyPage(<BulkUserImportPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['school']} />,
    children: [{ path: 'colegio', element: <RoleHomePage /> }],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
