import { Building2, ClipboardList, Info, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError } from "../../lib/toast";
import { schoolPortalService } from "../../services/school-portal.service";
import { surveysService } from "../../services/surveys.service";
import type { School } from "../../types/admin-school";
import type { AvailableSurvey } from "../../types/survey";

export function SchoolHomePage() {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [surveys, setSurveys] = useState<AvailableSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      schoolPortalService.ownSchool(),
      surveysService.listAvailable(),
    ])
      .then(([ownSchool, availableSurveys]) => {
        setSchool(ownSchool);
        setSurveys(availableSurveys);
      })
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <main className="p-8 text-mendoza-blue">Cargando portal…</main>;
  }

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Portal del establecimiento
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mendoza-text">
          Bienvenido/a, {user?.firstName}
        </h1>
        <p className="mt-2 text-mendoza-muted">
          Desde este espacio podés consultar los datos institucionales y el
          cuestionario disponible.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-mendoza-blue-soft p-3 text-mendoza-blue">
                <Building2 aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-mendoza-muted">
                  Establecimiento asociado
                </p>
                <h2 className="mt-1 text-xl font-bold text-mendoza-text">
                  {school?.name ?? "Sin establecimiento asociado"}
                </h2>
                {school && (
                  <>
                    <p className="mt-2 text-sm text-mendoza-muted">
                      CUE {school.cue}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-mendoza-text">
                      <MapPin aria-hidden="true" size={17} />
                      {school.locality}, {school.department}
                    </p>
                  </>
                )}
              </div>
            </div>
            {school && (
              <Link
                className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue transition hover:bg-mendoza-blue-soft"
                to="/colegio/establecimiento"
              >
                Ver datos institucionales
              </Link>
            )}
          </section>

          <section className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-xl bg-mendoza-sky/15 p-3 text-mendoza-blue">
              <ClipboardList aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-mendoza-text">
              Cuestionario institucional
            </h2>
            {surveys.length > 0 ? (
              <>
                <p className="mt-2 text-sm leading-6 text-mendoza-muted">
                  Hay {surveys.length} cuestionario
                  {surveys.length === 1 ? "" : "s"} con versión publicada para
                  consultar.
                </p>
                <Link
                  className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-mendoza-blue px-4 text-sm font-semibold text-white transition hover:bg-mendoza-blue-dark"
                  to="/colegio/cuestionario"
                >
                  Ver cuestionario
                </Link>
              </>
            ) : (
              <div className="mt-4 flex gap-3 rounded-xl bg-mendoza-background p-4 text-sm text-mendoza-muted">
                <Info aria-hidden="true" className="shrink-0" size={19} />
                Todavía no hay un cuestionario publicado. El portal lo mostrará
                cuando el equipo administrador publique una versión.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
