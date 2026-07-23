import { BarChart3, Info } from "lucide-react";

export function SchoolResultsPage() {
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Resultados
        </p>
        <h1 className="mt-2 text-3xl font-bold text-mendoza-text">
          Resultados institucionales
        </h1>
        <section className="mt-8 rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center">
          <BarChart3 className="mx-auto text-mendoza-blue" aria-hidden="true" size={38} />
          <h2 className="mt-4 text-xl font-bold text-mendoza-text">
            Todavía no hay resultados disponibles
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-mendoza-muted">
            Los resultados se mostrarán cuando exista una entrega evaluada por
            el motor de reglas del backend.
          </p>
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg bg-mendoza-background px-4 py-3 text-sm text-mendoza-muted">
            <Info aria-hidden="true" size={17} />
            No se calculan puntajes ni estrellas en el frontend.
          </p>
        </section>
      </div>
    </main>
  );
}
