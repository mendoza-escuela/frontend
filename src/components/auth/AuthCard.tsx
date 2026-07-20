import type { ReactNode } from 'react';
import { PublicHeader } from '../layout/PublicHeader';

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 h-1 w-14 rounded-full bg-[#C8A977]" />
          <h1 className="text-2xl font-bold text-[#000F9F]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
          {children}
        </section>
      </main>
    </div>
  );
}
