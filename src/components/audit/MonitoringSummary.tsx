import { Activity, Bell, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import type { MonitoringStatus } from '../../types/audit';

const notificationLabels: Record<string, string> = {
  sent: 'El servicio de correo aceptó el mensaje',
  failed: 'No se pudo enviar; se reintentará automáticamente',
  unconfigured: 'El servicio de correo todavía no está configurado',
  none: 'Sin alertas enviadas',
};

export function MonitoringSummary({ status }: { status: MonitoringStatus }) {
  const latest = status.monitoring.latest;
  return <div className="grid gap-4 lg:grid-cols-3">
    <Card><Activity aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Disponibilidad</h2>
      <p className="mt-2">Servidor de la aplicación: Disponible.</p>
      <p className="mt-2 text-sm">Base de datos: {latest.database ? 'Disponible' : 'No disponible'}.</p>
      <p className="mt-2 text-sm">Aplicación web: {latest.frontend ? 'Disponible' : 'No disponible'}.</p>
      <p className="mt-2 text-sm">Supervisión interna: {status.monitoring.status === 'ok' ? 'Operativa' : 'Incidente detectado'}.</p>
      <p className="mt-2 text-sm text-mendoza-muted">Última comprobación: {new Date(latest.checkedAt).toLocaleString('es-AR')}</p>
    </Card>
    <Card><Bell aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Alertas por correo</h2>
      <p className="mt-2 font-medium">{status.alerts.ready ? 'Configuradas' : 'Requieren atención'}</p>
      <p className="mt-2 text-sm">Responsables: {status.alerts.responsible}.</p>
      <p className="mt-2 text-sm">Administradores destinatarios: {latest.recipientCount}.</p>
      <p className="mt-2 text-sm">Servicio de correo: {latest.smtpConfigured ? 'Configurado' : 'Pendiente de configurar'}.</p>
      <p className="mt-2 text-sm">Último aviso de disponibilidad: {notificationLabels[latest.notificationStatus] ?? 'Estado desconocido'}.</p>
      <p className="mt-3 text-xs font-medium text-mendoza-muted">Se envía correo solamente por:</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-mendoza-muted">
        {status.alerts.notifiedEvents.map((event) => <li key={event}>{event}</li>)}
      </ul>
      <p className="mt-2 text-xs text-mendoza-muted">Los demás eventos quedan únicamente en este historial.</p>
    </Card>
    <Card><ShieldCheck aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Protección del historial</h2>
      <p className="mt-2">Los eventos de seguridad se guardan durante al menos un año.</p>
      <p className="mt-2 text-sm">Desde esta pantalla nadie puede modificarlos ni borrarlos.</p>
      <p className={`mt-3 text-sm font-medium ${status.retention.protected ? 'text-mendoza-success' : 'text-mendoza-error'}`}>{status.retention.protected ? 'Protección completa: el historial está protegido contra cambios y eliminaciones no autorizadas.' : 'Protección incompleta: el equipo técnico debe terminar la configuración antes de publicar el sistema.'}</p>
      {status.auditWriter.lastWriteFailureAt && <p className="mt-2 text-sm text-mendoza-error">No se pudo guardar un evento el {new Date(status.auditWriter.lastWriteFailureAt).toLocaleString('es-AR')}. El equipo técnico debe revisar el servicio.</p>}
    </Card>
  </div>;
}
