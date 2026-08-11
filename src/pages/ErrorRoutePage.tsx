import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useParams,
  useRouteError,
} from 'react-router-dom';
import { ErrorPage } from '../components/ui/ErrorPage';
import { useAuth } from '../hooks/useAuth';
import { getSafeInternalPath } from '../lib/safe-navigation';

type SupportedErrorCode = 401 | 403 | 404 | 500 | 503;

type ErrorPageConfiguration = {
  statusCode: SupportedErrorCode | 'Error';
  title: string;
  message: string;
  showBackButton?: boolean;
  showLoginButton?: boolean;
};

const ERROR_CONFIGURATIONS: Record<
  SupportedErrorCode | 'generic',
  ErrorPageConfiguration
> = {
  401: {
    statusCode: 401,
    title: 'Tu sesión finalizó',
    message:
      'Por seguridad, necesitás iniciar sesión nuevamente para continuar.',
    showBackButton: false,
    showLoginButton: true,
  },
  403: {
    statusCode: 403,
    title: 'No tenés permisos para acceder',
    message:
      'Tu cuenta no tiene autorización para ver esta página o realizar esta consulta.',
  },
  404: {
    statusCode: 404,
    title: 'No encontramos esta página',
    message:
      'La dirección puede ser incorrecta o el recurso ya no estar disponible.',
  },
  500: {
    statusCode: 500,
    title: 'No pudimos completar la solicitud',
    message:
      'Ocurrió un error inesperado. Intentá nuevamente más tarde o contactá a soporte si continúa.',
  },
  503: {
    statusCode: 503,
    title: 'Servicio temporalmente no disponible',
    message:
      'El sistema no puede responder en este momento. Esperá unos minutos e intentá nuevamente.',
  },
  generic: {
    statusCode: 'Error',
    title: 'Ocurrió un problema',
    message:
      'No pudimos completar la operación. Volvé a intentarlo o regresá al inicio.',
  },
};

type ErrorRouteState = {
  correlationId?: unknown;
  from?: unknown;
};

function getSupportedErrorCode(value: unknown): SupportedErrorCode | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const numericValue = Number(value);
  return [401, 403, 404, 500, 503].includes(numericValue)
    ? (numericValue as SupportedErrorCode)
    : null;
}

export function ErrorRoutePage({
  statusCode,
}: {
  statusCode?: SupportedErrorCode | 'generic';
}) {
  const routeParameters = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const requestedStatusCode = statusCode ?? routeParameters.statusCode;
  const supportedStatusCode = getSupportedErrorCode(requestedStatusCode);
  const configuration =
    ERROR_CONFIGURATIONS[
      statusCode === 'generic' || !supportedStatusCode
        ? 'generic'
        : supportedStatusCode
    ];
  const state = (location.state ?? {}) as ErrorRouteState;
  const previousPath =
    configuration.statusCode === 401
      ? getSafeInternalPath(state.from)
      : null;
  const homePath = user?.role === 'admin' ? '/admin' : user ? '/colegio' : '/';
  const loginPath = previousPath
    ? `/login?returnTo=${encodeURIComponent(previousPath)}`
    : '/login';

  return (
    <ErrorPage
      correlationId={
        typeof state.correlationId === 'string' ? state.correlationId : null
      }
      homePath={homePath}
      loginPath={loginPath}
      message={configuration.message}
      onBack={() => navigate(-1)}
      showBackButton={configuration.showBackButton}
      showLoginButton={configuration.showLoginButton}
      statusCode={configuration.statusCode}
      title={configuration.title}
    />
  );
}

function getRouteErrorCorrelationId(error: unknown) {
  if (!isRouteErrorResponse(error) || !error.data) return null;
  if (typeof error.data !== 'object') return null;
  const body = error.data as Record<string, unknown>;
  const candidate = body.correlationId ?? body.requestId ?? body.errorId;
  return typeof candidate === 'string' ? candidate : null;
}

/**
 * Fallback del data router. Usa mensajes institucionales fijos y nunca refleja
 * `message`, `stack` ni otros detalles técnicos del error capturado.
 */
export function RouteErrorBoundaryPage() {
  const routeError = useRouteError();
  const statusCode = isRouteErrorResponse(routeError)
    ? (getSupportedErrorCode(routeError.status) ?? 500)
    : 500;
  const configuration = ERROR_CONFIGURATIONS[statusCode];

  return (
    <ErrorPage
      correlationId={getRouteErrorCorrelationId(routeError)}
      message={configuration.message}
      showBackButton={configuration.showBackButton}
      showLoginButton={configuration.showLoginButton}
      statusCode={configuration.statusCode}
      title={configuration.title}
    />
  );
}
