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
import { AuthBrandMarks } from "../auth/AuthBrandMarks";
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
    <main className="relative isolate min-h-screen overflow-hidden bg-mendoza-background">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[36vh] min-h-64 overflow-hidden bg-mendoza-blue"
      >
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-mendoza-sky/10 blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-mendoza-gold" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <section
            aria-describedby="error-page-message"
            aria-labelledby="error-page-title"
            className="animate-panel-reveal overflow-hidden rounded-3xl border border-mendoza-border bg-white shadow-xl shadow-black/10"
          >
            <div className="border-b border-mendoza-border bg-white px-5 py-5 sm:px-8">
              <div className="max-w-md">
                <AuthBrandMarks />
              </div>
            </div>

            <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center md:gap-10 lg:px-12 lg:py-12">
              <div
                aria-hidden="true"
                className={`relative mx-auto flex h-36 w-36 items-center justify-center rounded-3xl ring-1 sm:h-40 sm:w-40 md:mx-0 ${presentation.iconContainerClassName}`}
              >
                <div className="absolute inset-3 rounded-2xl border border-white/70 bg-white/35" />
                <Icon
                  className={`relative ${presentation.iconClassName}`}
                  size={62}
                  strokeWidth={1.65}
                />
              </div>

              <div className="min-w-0 text-center md:text-left">
                <p className="inline-flex rounded-full bg-mendoza-blue-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-mendoza-blue ring-1 ring-mendoza-blue/10">
                  {statusLabel}
                </p>
                <h1
                  className="mt-4 text-3xl font-bold leading-tight text-mendoza-blue focus:outline-none focus:shadow-none sm:text-4xl"
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
                  <div className="mt-5 rounded-xl border border-mendoza-border bg-mendoza-background px-4 py-3 text-left">
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
      </div>
    </main>
  );
}
