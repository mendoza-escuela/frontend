import { Link } from 'react-router-dom';
import epsIcon from '../../assets/eps-icon.svg';
import epsLogoHorizontal from '../../assets/eps-logo-horizontal.svg';

const navigationItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Programa', href: '#programa' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Acceso', href: '#acceso' },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-mendoza-border bg-white/95 backdrop-blur" data-print-hidden="true">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <a className="flex min-w-0 items-center gap-3" href="#inicio">
          <img
            alt="Escuelas Promotoras de Salud"
            className="hidden h-14 w-auto max-w-[280px] md:block"
            src={epsLogoHorizontal}
          />
          <img
            alt=""
            aria-hidden="true"
            className="h-11 w-11 shrink-0 md:hidden"
            src={epsIcon}
          />
          <span className="min-w-0 md:hidden">
            <span className="block truncate text-sm font-bold leading-tight text-mendoza-blue">
              Escuelas Promotoras
            </span>
            <span className="block truncate text-sm font-bold leading-tight text-mendoza-sky">
              de Salud
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {navigationItems.map((navigationItem) => (
            <a
              className="text-sm font-semibold text-mendoza-text transition hover:text-mendoza-blue"
              href={navigationItem.href}
              key={navigationItem.label}
            >
              {navigationItem.label}
            </a>
          ))}
        </nav>

        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-mendoza-blue px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-mendoza-blue/20 transition hover:bg-mendoza-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue sm:min-h-11 sm:px-5 sm:py-2.5"
          to="/login"
        >
          <span className="sm:hidden">Ingresar</span>
          <span className="hidden sm:inline">Iniciar sesión</span>
        </Link>
      </div>
    </header>
  );
}
