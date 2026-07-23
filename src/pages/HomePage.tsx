import {
  BarChart3,
  ClipboardList,
  FileCheck2,
  MonitorCheck,
  School,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import epsIcon from '../assets/eps-icon.svg';
import { AnimatedNumber } from '../components/home/AnimatedNumber';
import { CertificationScale } from '../components/home/CertificationScale';
import { FeatureCard } from '../components/home/FeatureCard';
import { ProcessStep } from '../components/home/ProcessStep';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Reveal } from '../components/ui/Reveal';

const featureCards = [
  {
    icon: School,
    title: 'Relevamiento institucional',
    description:
      'Registro ordenado de datos clave del establecimiento para iniciar el diagnóstico institucional.',
  },
  {
    icon: ClipboardList,
    title: 'Carga de cuestionario',
    description:
      'Formulario guiado para completar la información requerida por el programa de manera clara.',
  },
  {
    icon: FileCheck2,
    title: 'Evaluación automática',
    description:
      'Base preparada para calcular indicadores, puntajes y niveles de certificación desde backend.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard de resultados',
    description:
      'Visualización centralizada para consultar avances, estados y resultados por establecimiento.',
  },
];

const processSteps = [
  'La escuela accede al sistema.',
  'Completa el cuestionario institucional.',
  'El sistema calcula indicadores y estrellas.',
  'Los administradores monitorean resultados.',
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-mendoza-background">
      <PublicHeader />

      <section
        className="relative overflow-hidden border-b border-mendoza-border bg-white"
        id="inicio"
      >
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-mendoza-sky-soft opacity-70 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-mendoza-gold/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-mendoza-sky-soft bg-mendoza-sky-soft/70 px-4 py-2 text-sm font-semibold text-mendoza-blue">
              <img alt="" aria-hidden="true" className="h-5 w-5" src={epsIcon} />
              Gobierno de Mendoza
            </div>

            <h1 className="mt-7 text-3xl font-bold leading-tight text-mendoza-blue min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
              Relevamiento, Evaluación y Monitoreo de Escuelas Promotoras de
              Salud
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-mendoza-muted">
              Plataforma digital para que los establecimientos educativos de
              Mendoza completen su diagnóstico institucional, consulten
              resultados y acompañen el proceso de certificación.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row" id="acceso">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-mendoza-blue px-6 py-3 text-sm font-bold text-white shadow-sm shadow-mendoza-blue/25 transition hover:bg-mendoza-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue"
                to="/login"
              >
                Iniciar sesión
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-mendoza-blue bg-white px-6 py-3 text-sm font-bold text-mendoza-blue transition hover:bg-mendoza-sky-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue"
                href="#programa"
              >
                Conocer el programa
              </a>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-3xl border border-mendoza-border bg-mendoza-background p-5 shadow-xl shadow-mendoza-blue/10 lg:p-7">
            <div className="pointer-events-none absolute inset-x-8 top-8 h-24 rounded-full bg-mendoza-sky-soft/70 blur-3xl" />
            <div className="pointer-events-none absolute bottom-8 right-8 h-28 w-28 rounded-full bg-mendoza-gold/15 blur-2xl" />

            <div className="animate-dashboard-card relative rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-mendoza-border pb-5">
                <div>
                  <p className="text-sm font-semibold text-mendoza-muted">
                    Plataforma institucional
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-mendoza-text">
                    Recorrido digital
                  </h2>
                </div>
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-mendoza-sky-soft text-mendoza-blue">
                  <img alt="" aria-hidden="true" className="h-8 w-8" src={epsIcon} />
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="animate-panel-reveal rounded-2xl border border-mendoza-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-mendoza-muted">
                      Experiencia web responsive
                    </span>
                    <span className="inline-flex rounded-full bg-mendoza-sky-soft px-3 py-1 text-xs font-bold text-mendoza-blue">
                      4 etapas
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-mendoza-muted">
                    Acceso seguro, relevamiento guiado, evaluación centralizada
                    y consulta de resultados.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="animate-metric-card rounded-2xl bg-mendoza-blue p-4 text-white">
                    <MonitorCheck aria-hidden="true" size={22} />
                    <p className="mt-4 text-2xl font-bold">
                      <AnimatedNumber value={5} />
                    </p>
                    <p className="mt-1 text-sm text-white/75">
                      niveles de certificación
                    </p>
                  </div>
                  <div className="animate-metric-card animation-delay-150 rounded-2xl bg-mendoza-sky-soft p-4 text-mendoza-blue">
                    <Sparkles aria-hidden="true" size={22} />
                    <p className="mt-4 text-2xl font-bold">
                      <AnimatedNumber value={100} />
                    </p>
                    <p className="mt-1 text-sm text-mendoza-blue/75">
                      puntos de referencia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="programa">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
            Programa
          </p>
          <h2 className="mt-3 text-3xl font-bold text-mendoza-text">
            Herramientas para acompañar la gestión institucional
          </h2>
          <p className="mt-4 text-base leading-7 text-mendoza-muted">
            Una entrada clara para que las escuelas carguen información y los
            equipos responsables puedan seguir el avance del programa.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" id="beneficios">
          {featureCards.map((featureCard, index) => (
            <Reveal
              delay={index === 0 ? 'none' : index === 1 ? 'short' : index === 2 ? 'medium' : 'long'}
              key={featureCard.title}
            >
              <FeatureCard
                description={featureCard.description}
                icon={featureCard.icon}
                title={featureCard.title}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
                Proceso
              </p>
              <h2 className="mt-3 text-3xl font-bold text-mendoza-text">
                Un flujo simple para ordenar el relevamiento
              </h2>
              <p className="mt-4 text-base leading-7 text-mendoza-muted">
                La plataforma organiza el recorrido desde el acceso de la
                escuela hasta el monitoreo de resultados por parte de los
                administradores.
              </p>
            </Reveal>

            <ol className="grid gap-4 sm:grid-cols-2">
              {processSteps.map((processStep, index) => (
                <Reveal
                  delay={index === 0 ? 'none' : index === 1 ? 'short' : index === 2 ? 'medium' : 'long'}
                  key={processStep}
                >
                  <ProcessStep description={processStep} step={index + 1} />
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-3xl border border-mendoza-border bg-white p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
              Certificación
            </p>
            <h2 className="mt-3 text-3xl font-bold text-mendoza-text">
              Escala visual de 1 a 5 estrellas
            </h2>
            <p className="mt-4 text-base leading-7 text-mendoza-muted">
              Esta representación anticipa la escala de certificación. La lógica
              real de evaluación, puntajes e indicadores se implementará en el
              backend.
            </p>
            </div>

            <div className="mt-8">
              <CertificationScale />
            </div>
          </div>
        </Reveal>
      </section>

      <PublicFooter />
    </div>
  );
}
