import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

type ProtectedRouteProps = {
  roles?: UserRole[];
  allowPasswordChange?: boolean;
};

export function ProtectedRoute({
  roles,
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const {
    user,
    isLoading,
    sessionExpired,
    authenticationErrorStatus,
  } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-mendoza-blue">
        Verificando sesión…
      </div>
    );
  }
  if (authenticationErrorStatus) {
    return (
      <Navigate
        replace
        state={{ from }}
        to={`/error/${authenticationErrorStatus}`}
      />
    );
  }
  if (!user && sessionExpired) {
    return <Navigate replace state={{ from }} to="/error/401" />;
  }
  if (!user) return <Navigate replace state={{ from }} to="/login" />;
  if (user.mustChangePassword && !allowPasswordChange) {
    return <Navigate replace to="/cambiar-clave" />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate replace state={{ from }} to="/error/403" />;
  }
  return <Outlet />;
}
