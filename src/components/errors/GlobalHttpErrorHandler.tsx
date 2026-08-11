import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  APP_HTTP_ERROR_EVENT,
  type AppHttpErrorDetail,
} from '../../lib/api';

/**
 * Traduce fallos HTTP inesperados de cargas de lectura a una ruta de error.
 * Los errores funcionales de formularios y mutaciones siguen resolviéndose en
 * su pantalla para no perder datos ni contexto de la persona usuaria.
 */
export function GlobalHttpErrorHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const showErrorPage = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as AppHttpErrorDetail | undefined;
      if (!detail || ![403, 500, 503].includes(detail.statusCode)) return;
      if (location.pathname.startsWith('/error/')) return;

      navigate(`/error/${detail.statusCode}`, {
        replace: true,
        state: {
          correlationId: detail.correlationId,
        },
      });
    };

    window.addEventListener(APP_HTTP_ERROR_EVENT, showErrorPage);
    return () =>
      window.removeEventListener(APP_HTTP_ERROR_EVENT, showErrorPage);
  }, [location.pathname, navigate]);

  return <Outlet />;
}
