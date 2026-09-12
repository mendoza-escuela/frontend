import { Activity, Bell, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import type { MonitoringStatus } from '../../types/audit';

const notificationLabels: Record<string, string> = {
  sent: 'Aceptado por SMTP',
  failed: 'Falló; se reintentará ante el próximo cambio',
  unconfigured: 'No pudo enviarse por falta de configuración',
  none: 'Sin alertas enviadas',
};

export function MonitoringSummary({ status }: { status: MonitoringStatus }) {
  const latest = status.monitoring.latest;
  return <div className="grid gap-4 lg:grid-cols-3">
    <Card><Activity aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Disponibilidad</h2>
      <p className="mt-2">API disponible · {status.latencyMs} ms</p>
      <p className="mt-2 text-sm">Base de datos: {latest.database ? 'Disponible' : 'No disponible'}.</p>
      <p className="mt-2 text-sm">Aplicación web: {latest.frontend ? 'Disponible' : 'No disponible'}.</p>
      <p className="mt-2 text-sm">Supervisión interna: {status.monitoring.status === 'ok' ? 'Operativa' : 'Incidente detectado'}.</p>
      <p className="mt-2 text-sm text-mendoza-muted">Última comprobación: {new Date(latest.checkedAt).toLocaleString('es-AR')}</p>
    </Card>
    <Card><Bell aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Alertas por correo</h2>
      <p className="mt-2 font-medium">{status.alerts.ready ? 'Configuradas' : 'Requieren atención'}</p>
      <p className="mt-2 text-sm">Responsables: {status.alerts.responsible}.</p>
      <p className="mt-2 text-sm">Administradores destinatarios: {latest.recipientCount}.</p>
      <p className="mt-2 text-sm">SMTP: {latest.smtpConfigured ? 'Configurado' : 'Pendiente de configurar'}.</p>
      <p className="mt-2 text-sm">Último envío: {notificationLabels[latest.notificationStatus] ?? 'Estado desconocido'}.</p>
    </Card>
    <Card><ShieldCheck aria-hidden="true" className="text-mendoza-blue" /><h2 className="mt-3 font-semibold">Conservación de auditoría</h2>
      <p className="mt-2">Mínimo de {status.retention.minimumDays} días.</p>
      <p className="mt-2 text-sm">{status.retention.purge}.</p>
      <p className={`mt-2 text-sm ${status.retention.protected ? 'text-mendoza-text' : 'text-mendoza-error'}`}>{status.retention.protected ? 'Registros protegidos y cuenta de aplicación sin privilegios de propietario.' : status.retention.runtimePrivileged ? 'Pendiente: usar una cuenta de aplicación sin privilegios de propietario.' : 'Pendiente: aplicar la migración de protección.'}</p>
      {status.auditWriter.lastWriteFailureAt && <p className="mt-2 text-sm text-mendoza-error">Hubo un fallo de persistencia el {new Date(status.auditWriter.lastWriteFailureAt).toLocaleString('es-AR')}. Revisar el respaldo de logs del servicio.</p>}
    </Card>
  </div>;
}
