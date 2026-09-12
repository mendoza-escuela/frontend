import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PaginationControls } from '../../components/ui/PaginationControls';
import { AuditFiltersForm } from '../../components/audit/AuditFiltersForm';
import { MonitoringSummary } from '../../components/audit/MonitoringSummary';
import { auditService } from '../../services/audit.service';
import type { AuditFilters, AuditPage, MonitoringStatus } from '../../types/audit';

export function AuditAdminPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, limit: 25 });
  const [events, setEvents] = useState<AuditPage | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  async function load(next = filters) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const [auditPage, status] = await Promise.all([auditService.list(next, controller.signal), auditService.monitoring(controller.signal)]);
      if (!controller.signal.aborted) { setEvents(auditPage); setMonitoring(status); setError(false); }
    } catch {
      if (!controller.signal.aborted) { setError(true); setMonitoring(null); setEvents(null); }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  function refresh() { setLoading(true); void load(); }
  function applyFilters(next: AuditFilters) { setLoading(true); setFilters(next); }
  useEffect(() => {
    void load(filters);
    const timer = window.setInterval(() => { if (!document.hidden) void load(filters); }, 60_000);
    return () => { window.clearInterval(timer); activeRequest.current?.abort(); };
  }, [filters]);

  return <main className="space-y-6 p-4 sm:p-8">
    <PageHeader eyebrow="Administración" title="Auditoría y salud"
      description="Eventos de acceso, actividad administrativa y salud de la aplicación. Comprobación interna cada minuto."
      actions={<Button disabled={loading} onClick={refresh} icon={<RefreshCw size={16} aria-hidden="true" />}>Actualizar</Button>} />
    {monitoring && <><MonitoringSummary status={monitoring} /><p className="text-xs text-mendoza-muted">Consulta realizada: {new Date(monitoring.timestamp).toLocaleString('es-AR')}. La aceptación SMTP no confirma lectura del correo.</p></>}
    {error && <ErrorState message="No se pudo consultar la auditoría y el estado del servicio. No se puede confirmar disponibilidad." onRetry={refresh} />}
    <Card><h2 className="mb-4 text-lg font-semibold">Buscar eventos</h2><AuditFiltersForm onApply={applyFilters} loading={loading} /></Card>
    {loading && <LoadingState label="Consultando auditoría…" />}
    {events && <Card><h2 className="mb-4 text-lg font-semibold">Registro de eventos</h2>
      <p className="mb-4 text-sm text-mendoza-muted">Los usuarios se identifican por su ID. Los eventos históricos pueden no tener IP o correlación. Los registros se consultan; no se editan ni eliminan desde el panel.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Eventos de auditoría ordenados del más reciente al más antiguo</caption>
        <thead><tr className="border-b border-mendoza-border">{['Fecha y hora', 'Evento', 'Usuario / servicio', 'Origen', 'Detalle'].map((label) => <th key={label} scope="col" className="p-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{events.items.map((event) => <tr key={event.id} className="border-b border-mendoza-border align-top">
          <td className="whitespace-nowrap p-3">{new Date(event.createdAt).toLocaleString('es-AR')}</td>
          <td className="p-3"><p className="font-medium">{event.action}</p><p className={event.severity === 'error' ? 'text-mendoza-error' : 'text-mendoza-muted'}>{({ info: 'Información', warning: 'Advertencia', error: 'Error' })[event.severity]}</p></td>
          <td className="max-w-56 break-words p-3">{event.actorUserId ?? 'Sin usuario identificado'}<p className="text-mendoza-muted">{event.service}</p></td>
          <td className="p-3">{event.sourceIp ?? 'No disponible'}</td>
          <td className="p-3"><details><summary className="cursor-pointer rounded text-mendoza-blue focus-visible:outline-2">Ver detalle</summary>
            <p className="mt-2 break-all">Solicitud: {event.requestId ?? 'No disponible'}</p>
            <p>Recurso: {event.entityType} {event.entityId}</p>
            <pre className="mt-2 max-w-lg whitespace-pre-wrap break-words rounded bg-mendoza-background p-3 text-xs">{JSON.stringify(event.changes, null, 2)}</pre>
          </details></td>
        </tr>)}</tbody>
      </table></div>
      {!events.items.length && <p className="py-6 text-center text-mendoza-muted">No hay eventos para estos filtros.</p>}
      <PaginationControls pagination={events} loading={loading} onPageChange={(page) => applyFilters({ ...filters, page })} />
    </Card>}
  </main>;
}
