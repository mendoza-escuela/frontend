import {
  ArrowLeft,
  CloudOff,
  FileQuestion,
  House,
  LogIn,
  ServerCrash,
  ShieldX,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import epsLogoHorizontal from "../../assets/eps-logo-horizontal.svg";
import { Button } from "./Button";
import { getButtonClassName } from "./button-styles";

export type ErrorPageProps = {
  statusCode?: number | string;
  title: string;
  message: string;
  correlationId?: string | null;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  showLoginButton?: boolean;
  onBack?: () => void;
  homePath?: string;
  loginPath?: string;
};

type ErrorPresentation = {
  icon: LucideIcon;
  iconContainerClassName: string;
  iconClassName: string;
};

const errorPresentations: Record<string, ErrorPresentation> = {
  "401": {
    icon: LogIn,
    iconContainerClassName: "bg-mendoza-blue-soft ring-mendoza-blue/10",
    iconClassName: "text-mendoza-blue",
  },
  "403": {
    icon: ShieldX,
    iconContainerClassName: "bg-mendoza-error/5 ring-mendoza-error/10",
    iconClassName: "text-mendoza-error",
  },
  "404": {
    icon: FileQuestion,
    iconContainerClassName: "bg-mendoza-sky-soft ring-mendoza-sky/20",
    iconClassName: "text-mendoza-blue",
  },
  "500": {
    icon: ServerCrash,
    iconContainerClassName: "bg-mendoza-error/5 ring-mendoza-error/10",
    iconClassName: "text-mendoza-error",
  },
  "503": {
    icon: CloudOff,
    iconContainerClassName: "bg-mendoza-gold/15 ring-mendoza-gold/25",
    iconClassName: "text-mendoza-blue",
  },
  error: {
    icon: TriangleAlert,
    iconContainerClassName: "bg-mendoza-error/5 ring-mendoza-error/10",
    iconClassName: "text-mendoza-error",
  },
};

function normalizeStatusCode(statusCode: ErrorPageProps["statusCode"]) {
  const normalizedStatusCode = String(statusCode ?? "Error").trim();
  return normalizedStatusCode || "Error";
}

function getSafeCorrelationId(correlationId: string | null | undefined) {
  const normalizedCorrelationId = correlationId?.trim();
  if (
    !normalizedCorrelationId ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(normalizedCorrelationId)
  ) {
    return null;
  }

  return normalizedCorrelationId;
}

/**
 * Página institucional para errores de navegación, autorización y servidor.
 * Solo admite un identificador de correlación con formato seguro; los detalles
 * internos del error deben permanecer en los registros del backend.
 */
export function ErrorPage({
  statusCode = "Error",
  title,
  message,
  correlationId,
  showBackButton = true,
  showHomeButton = true,
  showLoginButton = false,
  onBack,
  homePath = "/",
  loginPath = "/login",
}: ErrorPageProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const normalizedStatusCode = normalizeStatusCode(statusCode);
  const presentationKey = normalizedStatusCode.toLowerCase();
  const presentation =
    errorPresentations[presentationKey] ?? errorPresentations.error;
  const Icon = presentation.icon;
  const safeCorrelationId = getSafeCorrelationId(correlationId);
  const statusLabel =
    presentationKey === "error" || presentationKey === "generic"
      ? "Error"
      : `Error ${normalizedStatusCode}`;
  const hasActions =
    showBackButton || showHomeButton || showLoginButton;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    window.history.back();
  };

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-mendoza-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute -left-28 top-16 -z-10 h-72 w-72 rounded-full bg-mendoza-sky/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-20 -z-10 h-80 w-80 rounded-full bg-mendoza-gold/15 blur-3xl"
      />

      <div className="mx-auto w-full max-w-4xl">
        <section
          aria-describedby="error-page-message"
          aria-labelledby="error-page-title"
          className="animate-panel-reveal overflow-hidden rounded-2xl border border-mendoza-border bg-white shadow-sm"
        >
          <div aria-hidden="true" className="h-1.5 bg-mendoza-gold" />

          <div className="border-b border-mendoza-border px-6 py-4 sm:px-8">
            <img
              alt="Escuelas Promotoras de Salud"
              className="h-12 w-auto max-w-full sm:h-14"
              src={epsLogoHorizontal}
            />
          </div>

          <div className="grid gap-7 px-6 py-8 sm:px-8 sm:py-10 md:grid-cols-[9rem_minmax(0,1fr)] md:items-center md:gap-10 lg:px-12 lg:py-12">
            <div
              aria-hidden="true"
              className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full ring-8 sm:h-32 sm:w-32 md:mx-0 ${presentation.iconContainerClassName}`}
            >
              <Icon
                className={presentation.iconClassName}
                size={58}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0 text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-mendoza-blue">
                {statusLabel}
              </p>
              <h1
                className="mt-2 text-3xl font-bold leading-tight text-mendoza-text sm:text-4xl"
                id="error-page-title"
                ref={headingRef}
                tabIndex={-1}
              >
                {title}
              </h1>
              <p
                className="mx-auto mt-4 max-w-2xl text-base leading-7 text-mendoza-muted md:mx-0"
                id="error-page-message"
              >
                {message}
              </p>

              {safeCorrelationId && (
                <div className="mt-5 rounded-lg border border-mendoza-border bg-mendoza-background px-4 py-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-mendoza-muted">
                    Identificador del error
                  </p>
                  <code className="mt-1 block break-all text-sm font-semibold text-mendoza-text">
                    {safeCorrelationId}
                  </code>
                  <p className="mt-1 text-xs leading-5 text-mendoza-muted">
                    Compartilo con soporte si necesitás ayuda.
                  </p>
                </div>
              )}

              {hasActions && (
                <div
                  aria-label="Acciones para resolver el error"
                  className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
                  role="group"
                >
                  {showBackButton && (
                    <Button
                      className="w-full sm:w-auto"
                      icon={<ArrowLeft aria-hidden="true" size={18} />}
                      onClick={handleBack}
                      variant="outline"
                    >
                      Volver
                    </Button>
                  )}
                  {showHomeButton && (
                    <a
                      className={getButtonClassName(
                        showLoginButton ? "outline" : "primary",
                        "w-full sm:w-auto",
                      )}
                      href={homePath}
                    >
                      <House aria-hidden="true" size={18} />
                      Ir al inicio
                    </a>
                  )}
                  {showLoginButton && (
                    <a
                      className={getButtonClassName(
                        "primary",
                        "w-full sm:w-auto",
                      )}
                      href={loginPath}
                    >
                      <LogIn aria-hidden="true" size={18} />
                      Iniciar sesión nuevamente
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs font-medium text-mendoza-muted sm:text-sm">
          Programa Escuelas Promotoras de Salud · Gobierno de Mendoza
        </p>
      </div>
    </main>
  );
}
