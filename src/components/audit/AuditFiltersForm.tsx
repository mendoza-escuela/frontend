import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { SearchableSelect } from '../ui/SearchableSelect';
import type { AuditFilters } from '../../types/audit';

const schema = z.object({
  action: z.string(),
  severity: z.enum(['', 'info', 'warning', 'error']),
  from: z.string(),
  to: z.string(),
}).refine((values) => !values.from || !values.to || values.from <= values.to, {
  path: ['to'],
  message: 'La fecha final debe ser posterior a la inicial.',
});
type Fields = z.infer<typeof schema>;

const eventOptions = [
  ['', 'Todos los eventos'],
  ['AUTH_LOGIN_FAILED', 'Ingresos rechazados'],
  ['AUTH_ACCOUNT_LOCKED', 'Cuentas bloqueadas automáticamente'],
  ['USER_BLOCKED', 'Usuarios bloqueados por un administrador'],
  ['ACCESS_DENIED', 'Accesos sin permiso'],
  ['HTTP_SERVER_ERROR', 'Errores internos'],
  ['SERVICE_HEALTH_DEGRADED', 'Problemas de disponibilidad'],
  ['SERVICE_HEALTH_RECOVERED', 'Recuperaciones del servicio'],
] as const;

export function AuditFiltersForm({
  onApply,
  loading,
}: {
  onApply: (filters: AuditFilters) => void;
  loading: boolean;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { action: '', severity: '', from: '', to: '' },
  });

  return <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit((fields) => onApply({
    page: 1,
    limit: 25,
    action: fields.action || undefined,
    severity: fields.severity || undefined,
    from: fields.from ? new Date(fields.from).toISOString() : undefined,
    to: fields.to ? new Date(fields.to).toISOString() : undefined,
  }))}>
    <Controller
      control={control}
      name="action"
      render={({ field }) => (
        <SearchableSelect
          allLabel="Todos los eventos"
          label="Tipo de evento"
          onBlur={field.onBlur}
          onChange={field.onChange}
          options={eventOptions.slice(1).map(([value, label]) => ({ value, label }))}
          value={field.value}
        />
      )}
    />
    <Controller
      control={control}
      name="severity"
      render={({ field }) => (
        <SearchableSelect
          allLabel="Todas"
          label="Importancia"
          onBlur={field.onBlur}
          onChange={field.onChange}
          options={[
            { value: 'info', label: 'Informativos' },
            { value: 'warning', label: 'Requieren revisión' },
            { value: 'error', label: 'Críticos' },
          ]}
          value={field.value}
        />
      )}
    />
    {([['from', 'Desde'], ['to', 'Hasta']] as const).map(([name, label]) => <label key={name} className="text-sm font-medium">
      {label}<input {...register(name)} type="datetime-local" aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="mt-1 min-h-11 w-full rounded-lg border border-mendoza-border px-3 focus:outline-2 focus:outline-mendoza-blue" />
      {errors[name] && <span id={`${name}-error`} className="text-mendoza-error">{errors[name]?.message}</span>}
    </label>)}
    <Button className="self-end justify-self-start px-4" type="submit" disabled={loading}>Aplicar filtros</Button>
  </form>;
}
