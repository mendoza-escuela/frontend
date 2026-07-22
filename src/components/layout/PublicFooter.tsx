import { Link } from 'react-router-dom';

const footerLinks = [
  { label: 'Ayuda', href: '#ayuda' },
  { label: 'Contacto', href: '#contacto' },
  { label: 'Acceso administradores', href: '/login' },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-mendoza-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p className="text-sm font-medium text-mendoza-text">
          Programa Escuelas Promotoras de Salud - Mendoza
        </p>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Pie de página">
          {footerLinks.map((footerLink) =>
            footerLink.href.startsWith('/') ? (
              <Link
                className="text-sm font-medium text-mendoza-muted transition hover:text-mendoza-blue"
                key={footerLink.label}
                to={footerLink.href}
              >
                {footerLink.label}
              </Link>
            ) : (
              <a
                className="text-sm font-medium text-mendoza-muted transition hover:text-mendoza-blue"
                href={footerLink.href}
                key={footerLink.label}
              >
                {footerLink.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
