import type { ReactNode } from "react";
import { AuthBrandMarks } from "./AuthBrandMarks";

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-mendoza-background">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[36vh] min-h-56 bg-mendoza-blue"
      >
        <div className="absolute inset-x-0 bottom-0 h-1 bg-mendoza-gold" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-lg overflow-hidden rounded-3xl border border-mendoza-border bg-white shadow-xl shadow-black/10">
          <div className="border-b border-mendoza-border bg-white px-5 py-6 sm:px-8 sm:py-7">
            <AuthBrandMarks />
          </div>
          <div className="p-6 sm:p-8">
            <div className="mb-6 h-1 w-14 rounded-full bg-mendoza-gold" />
            <h1 className="text-2xl font-bold text-mendoza-blue sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-mendoza-muted">
              {description}
            </p>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
