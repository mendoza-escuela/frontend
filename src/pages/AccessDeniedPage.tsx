import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AccessDeniedPage() {
  const { user } = useAuth(); const destination = user?.role === 'admin' ? '/admin' : '/colegio';
  return <main className="grid min-h-screen place-items-center bg-mendoza-background px-4 text-center"><section className="max-w-md rounded-2xl bg-white p-8 shadow-sm"><ShieldX className="mx-auto text-mendoza-error" size={44} /><h1 className="mt-4 text-2xl font-bold text-mendoza-blue">Acceso denegado</h1><p className="mt-3 text-mendoza-muted">Tu rol no tiene permiso para acceder a este recurso.</p><Link className="mt-6 inline-flex rounded-lg bg-mendoza-blue px-5 py-3 font-semibold text-white" to={destination}>Volver al panel</Link></section></main>;
}
