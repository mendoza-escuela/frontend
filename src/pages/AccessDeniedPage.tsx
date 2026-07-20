import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AccessDeniedPage() {
  const { user } = useAuth(); const destination = user?.role === 'admin' ? '/admin' : '/colegio';
  return <main className="grid min-h-screen place-items-center bg-[#F7F4EF] px-4 text-center"><section className="max-w-md rounded-2xl bg-white p-8 shadow-sm"><ShieldX className="mx-auto text-[#DC2626]" size={44} /><h1 className="mt-4 text-2xl font-bold text-[#000F9F]">Acceso denegado</h1><p className="mt-3 text-[#6B7280]">Tu rol no tiene permiso para acceder a este recurso.</p><Link className="mt-6 inline-flex rounded-lg bg-[#000F9F] px-5 py-3 font-semibold text-white" to={destination}>Volver al panel</Link></section></main>;
}
