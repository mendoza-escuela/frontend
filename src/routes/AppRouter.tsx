import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { RoleHomePage } from '../pages/RoleHomePage';

const router = createBrowserRouter([
  { element: <AppLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'recuperar-clave', element: <ForgotPasswordPage /> },
    { path: 'restablecer-clave', element: <ResetPasswordPage /> },
  ] },
  { element: <ProtectedRoute allowPasswordChange />, children: [
    { path: 'cambiar-clave', element: <ChangePasswordPage /> },
    { path: 'acceso-denegado', element: <AccessDeniedPage /> },
  ] },
  { element: <ProtectedRoute roles={['admin']} />, children: [{ path: 'admin', element: <RoleHomePage /> }] },
  { element: <ProtectedRoute roles={['school']} />, children: [{ path: 'colegio', element: <RoleHomePage /> }] },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
