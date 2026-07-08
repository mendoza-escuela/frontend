import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <PublicHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wide text-[#007C89]">
          Acceso
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#003A70]">
          Inicio de sesión en preparación
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6B7280]">
          Esta ruta queda preparada para conectar el formulario real de acceso
          cuando se implemente el flujo de autenticación.
        </p>
        <Link
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#007C89] bg-white px-5 py-2.5 text-sm font-bold text-[#007C89] transition hover:bg-[#D8F1F7]"
          to="/"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
