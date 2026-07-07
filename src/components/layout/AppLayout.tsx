import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-600 text-white">
              <ShieldCheck aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Mendoza
              </p>
              <h1 className="text-lg font-semibold text-slate-950">
                Base full stack
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
