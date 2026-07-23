import type { ReactNode } from 'react';
import { PublicHeader } from '../layout/PublicHeader';

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-mendoza-background">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <section className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 h-1 w-14 rounded-full bg-mendoza-gold" />
          <h1 className="text-2xl font-bold text-mendoza-blue">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-mendoza-muted">{description}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
