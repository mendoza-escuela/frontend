import { Building2, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { showError } from '../lib/toast';

export function RoleHomePage() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const closeSession = async () => {
    try { await logout(); navigate('/login', { replace: true }); }
    catch { showError('No se pudo cerrar la sesión correctamente.'); }
  };
  return <main className="min-h-screen bg-[#F7F4EF] p-4 sm:p-8">
    <section className="mx-auto max-w-5xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div className="flex items-center gap-3">{isAdmin ? <ShieldCheck className="text-[#000F9F]" /> : <Building2 className="text-[#000F9F]" />}<div><p className="text-sm text-[#6B7280]">{isAdmin ? 'Perfil Administrador' : 'Perfil Colegio'}</p><h1 className="text-xl font-bold text-[#000F9F]">Escuelas Promotoras de Salud</h1></div></div>
        <Button icon={<LogOut size={17} />} onClick={closeSession} variant="outline">Cerrar sesión</Button>
      </header>
      <div className="py-8"><h2 className="text-2xl font-bold text-[#1F2937]">Bienvenido/a</h2><p className="mt-2 text-[#6B7280]">{user?.email}</p>{user?.lastLoginAt && <p className="mt-4 rounded-lg bg-[#3CB4E5]/10 p-3 text-sm text-[#1F2937]">Último acceso registrado: {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(user.lastLoginAt))}</p>}</div>
    </section>
  </main>;
}
