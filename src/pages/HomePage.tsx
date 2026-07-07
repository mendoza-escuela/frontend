import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { showError, showSuccess } from '../lib/toast';
import {
  getDatabaseHealthStatus,
  getHealthStatus,
} from '../services/health.service';
import type { DatabaseHealthStatus, HealthStatus } from '../types/health';

const accessFormSchema = z.object({
  email: z.string().email('Ingresa un email valido.'),
});

type AccessFormValues = z.infer<typeof accessFormSchema>;

export function HomePage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [databaseStatus, setDatabaseStatus] =
    useState<DatabaseHealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isCheckingDatabase, setIsCheckingDatabase] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AccessFormValues>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const checkHealth = async () => {
    try {
      setIsCheckingHealth(true);
      const status = await getHealthStatus();
      setHealthStatus(status);
      showSuccess('Backend disponible.');
    } catch {
      setHealthStatus(null);
      showError('No se pudo consultar el estado del backend.');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const checkDatabase = async () => {
    try {
      setIsCheckingDatabase(true);
      const status = await getDatabaseHealthStatus();
      setDatabaseStatus(status);
      showSuccess('Conexion con PostgreSQL disponible.');
    } catch {
      setDatabaseStatus(null);
      showError('No se pudo validar la conexion con PostgreSQL.');
    } finally {
      setIsCheckingDatabase(false);
    }
  };

  const submitAccessForm = async ({ email }: AccessFormValues) => {
    showSuccess(`Formulario validado para ${email}.`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Arquitectura inicial
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          React, NestJS, TypeORM y PostgreSQL listos para desarrollar
        </h2>
        <p className="mt-4 max-w-2xl text-slate-600">
          La base incluye rutas, servicios HTTP centralizados, validacion de
          formularios, notificaciones, seguridad backend y migraciones.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            disabled={isCheckingHealth}
            icon={
              isCheckingHealth ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
              ) : (
                <CheckCircle2 aria-hidden="true" size={18} />
              )
            }
            onClick={checkHealth}
          >
            Consultar backend
          </Button>
          {healthStatus ? (
            <span className="text-sm text-slate-600">
              Estado: {healthStatus.status} - {healthStatus.timestamp}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={isCheckingDatabase}
            icon={
              isCheckingDatabase ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
              ) : (
                <CheckCircle2 aria-hidden="true" size={18} />
              )
            }
            onClick={checkDatabase}
          >
            Probar PostgreSQL
          </Button>
          {databaseStatus ? (
            <span className="text-sm text-slate-600">
              DB: {databaseStatus.status} - {databaseStatus.latencyMs} ms
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-950">Formulario base</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit(submitAccessForm)}>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="email"
              placeholder="persona@ejemplo.com"
              type="email"
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <Button disabled={isSubmitting} type="submit">
            Validar
          </Button>
        </form>
      </section>
    </div>
  );
}
