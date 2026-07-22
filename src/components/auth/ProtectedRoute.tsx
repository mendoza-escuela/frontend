import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

export function ProtectedRoute({ roles, allowPasswordChange = false }: { roles?: UserRole[]; allowPasswordChange?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="grid min-h-screen place-items-center text-mendoza-blue">Verificando sesión…</div>;
  if (!user) return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  if (user.mustChangePassword && !allowPasswordChange) return <Navigate replace to="/cambiar-clave" />;
  if (roles && !roles.includes(user.role)) return <Navigate replace to="/acceso-denegado" />;
  return <Outlet />;
}
