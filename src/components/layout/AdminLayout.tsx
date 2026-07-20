import { Building2, Home, LogOut, Upload, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { showError } from '../../lib/toast';

const links = [
  { to: '/admin', label: 'Inicio', icon: Home, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/usuarios/importar', label: 'Importar', icon: Upload },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const closeSession = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      showError('No se pudo cerrar la sesión correctamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] lg:flex">
      <aside className="bg-[#000F9F] p-4 text-white lg:min-h-screen lg:w-64 lg:p-6">
        <div className="flex items-center gap-3 border-b border-white/20 pb-5">
          <Building2 aria-hidden="true" />
          <div><p className="font-bold">Escuelas Promotoras</p><p className="text-xs text-white/75">Administración</p></div>
        </div>
        <nav aria-label="Administración" className="mt-5 flex gap-2 overflow-x-auto lg:flex-col">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink className={({ isActive }) => `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-[#3CB4E5] text-[#1F2937]' : 'text-white hover:bg-white/10'}`} end={end} key={to} to={to}><Icon size={18} />{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-8">
          <div><p className="text-sm text-[#6B7280]">Sesión de administrador</p><p className="font-semibold text-[#1F2937]">{user?.firstName} {user?.lastName}</p></div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#000F9F] px-4 text-sm font-semibold text-[#000F9F] hover:bg-[#EEF0FF]" onClick={closeSession} type="button"><LogOut size={17} />Cerrar sesión</button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
