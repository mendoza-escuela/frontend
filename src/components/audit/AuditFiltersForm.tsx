import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import type { AuditFilters } from '../../types/audit';

const optionalUuid = z.union([z.literal(''), z.uuid('Ingresá un UUID válido.')]);
const schema = z.object({
  action: z.string().regex(/^$|^[A-Z][A-Z0-9_]{0,79}$/, 'Usá el código del evento en mayúsculas.'),
  severity: z.enum(['', 'info', 'warning', 'error']),
  actorUserId: optionalUuid, requestId: optionalUuid, from: z.string(), to: z.string(),
}).refine((values) => !values.from || !values.to || values.from <= values.to, { path: ['to'], message: 'La fecha final debe ser posterior a la inicial.' });
type Fields = z.infer<typeof schema>;

export function AuditFiltersForm({ onApply, loading }: { onApply: (filters: AuditFilters) => void; loading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Fields>({
    resolver: zodResolver(schema), defaultValues: { action: '', severity: '', actorUserId: '', requestId: '', from: '', to: '' },
  });
  return <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={handleSubmit((fields) => onApply({
    page: 1, limit: 25, action: fields.action || undefined, severity: fields.severity || undefined,
    actorUserId: fields.actorUserId || undefined, requestId: fields.requestId || undefined,
    from: fields.from ? new Date(fields.from).toISOString() : undefined,
    to: fields.to ? new Date(fields.to).toISOString() : undefined,
  }))}>
    {([
      ['action', 'Código del evento', 'text'], ['actorUserId', 'ID del usuario', 'text'],
      ['requestId', 'ID de solicitud', 'text'], ['from', 'Desde (hora local)', 'datetime-local'], ['to', 'Hasta (hora local)', 'datetime-local'],
    ] as const).map(([name, label, type]) => <label key={name} className="text-sm font-medium">
      {label}<input {...register(name)} type={type} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
        className="mt-1 min-h-11 w-full rounded-lg border border-mendoza-border px-3 focus:outline-2 focus:outline-mendoza-blue" />
      {errors[name] && <span id={`${name}-error`} className="text-mendoza-error">{errors[name]?.message}</span>}
    </label>)}
    <label className="text-sm font-medium">Severidad<select {...register('severity')} className="mt-1 min-h-11 w-full rounded-lg border border-mendoza-border px-3 focus:outline-2 focus:outline-mendoza-blue">
      <option value="">Todas</option><option value="info">Información</option><option value="warning">Advertencia</option><option value="error">Error</option>
    </select></label>
    <Button type="submit" disabled={loading}>Aplicar filtros</Button>
  </form>;
}
