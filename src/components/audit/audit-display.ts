import type { AuditEvent } from '../../types/audit';

const eventLabels: Record<string, string> = {
  ACCESS_DENIED: 'Acceso rechazado por falta de permisos',
  ADMIN_EXPORT_STARTED: 'Exportación administrativa iniciada',
  ADMIN_REQUEST: 'Actividad administrativa',
  AUTHENTICATION_REJECTED: 'Sesión inválida o vencida',
  AUTH_ACCOUNT_LOCKED: 'Cuenta bloqueada por intentos fallidos',
  AUTH_CHANGE_PASSWORD_FAILED: 'Cambio de contraseña rechazado',
  AUTH_CHANGE_PASSWORD_SUCCESS: 'Contraseña modificada',
  AUTH_FORGOT_PASSWORD_FAILED: 'Solicitud de recuperación rechazada',
  AUTH_FORGOT_PASSWORD_SUCCESS: 'Recuperación de contraseña solicitada',
  AUTH_LOGIN_FAILED: 'Inicio de sesión rechazado',
  AUTH_LOGIN_SUCCESS: 'Inicio de sesión correcto',
  AUTH_LOGOUT_SUCCESS: 'Sesión cerrada',
  AUTH_RESET_PASSWORD_FAILED: 'Restablecimiento de contraseña rechazado',
  AUTH_RESET_PASSWORD_SUCCESS: 'Contraseña restablecida',
  AUTH_SESSION_CREATED: 'Nueva sesión iniciada',
  CAMPAIGN_CREATED: 'Etapa creada',
  CAMPAIGN_DELETED: 'Etapa eliminada',
  CAMPAIGN_STATUS_CHANGED: 'Estado de etapa modificado',
  CAMPAIGN_UPDATED: 'Etapa actualizada',
  HTTP_SERVER_ERROR: 'Error interno de la aplicación',
  RATE_LIMIT_EXCEEDED: 'Demasiadas solicitudes consecutivas',
  SCHOOL_ACTIVATED: 'Colegio habilitado',
  SCHOOL_CREATED: 'Colegio creado',
  SCHOOL_DEACTIVATED: 'Colegio deshabilitado',
  SCHOOL_RECTIFIED: 'Datos del colegio rectificados',
  SCHOOL_UPDATED: 'Colegio actualizado',
  SERVICE_HEALTH_DEGRADED: 'Problema de disponibilidad detectado',
  SERVICE_HEALTH_RECOVERED: 'Servicio recuperado',
  SURVEY_CREATED: 'Cuestionario creado',
  SURVEY_DELETED: 'Cuestionario eliminado',
  SURVEY_UPDATED: 'Cuestionario actualizado',
  SURVEY_VERSION_ARCHIVED: 'Versión de cuestionario archivada',
  SURVEY_VERSION_CREATED: 'Versión de cuestionario creada',
  SURVEY_VERSION_IMPORTED: 'Cuestionario importado',
  SURVEY_VERSION_PUBLISHED: 'Versión de cuestionario publicada',
  USER_BLOCKED: 'Usuario bloqueado',
  USER_CREATED: 'Usuario creado',
  USER_PASSWORD_RESET: 'Contraseña temporal generada',
  USER_PRIVILEGES_CHANGED: 'Permisos del usuario modificados',
  USER_SCHOOL_UNASSIGNED: 'Usuario desvinculado de un colegio',
  USER_UNBLOCKED: 'Usuario habilitado',
  USER_UPDATED: 'Usuario actualizado',
};

const routeLabels: Array<[string, string]> = [
  ['/admin/dashboard/participation', 'el panel de participación'],
  ['/admin/monitoring', 'el estado general de la aplicación'],
  ['/admin/audit', 'el registro de auditoría'],
  ['/admin/users', 'la administración de usuarios'],
  ['/admin/schools', 'la administración de colegios'],
  ['/admin/surveys', 'la administración de cuestionarios'],
  ['/admin/campaigns', 'la administración de etapas'],
  ['/auth/login', 'el inicio de sesión'],
];

function textValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function routeDescription(route: string | null): string {
  if (!route) return 'una función de la aplicación';
  return routeLabels.find(([fragment]) => route.includes(fragment))?.[1]
    ?? 'una función administrativa';
}

function durationDescription(duration: number | null): string {
  if (duration === null) return '';
  if (duration < 1_000) return ' Respondió en menos de un segundo.';
  return ` Respondió en ${(duration / 1_000).toFixed(1)} segundos.`;
}

export function auditEventLabel(action: string): string {
  return eventLabels[action] ?? 'Actividad registrada por la aplicación';
}

export function auditActorLabel(event: AuditEvent): string {
  if (event.actorName) {
    return event.actorEmail
      ? `${event.actorName} · ${event.actorEmail}`
      : event.actorName;
  }
  if (event.actorUserId) return 'Usuario que ya no está disponible';
  return event.service === 'backend' ? 'Aplicación' : 'Servicio automático';
}

export function auditEventDescription(event: AuditEvent): string {
  const route = textValue(event.changes.route);
  const status = numberValue(event.changes.statusCode);
  const duration = numberValue(event.changes.durationMs);
  const durationText = durationDescription(duration);

  switch (event.action) {
    case 'ADMIN_REQUEST':
      return `Se consultó ${routeDescription(route)} correctamente.${durationText}`;
    case 'AUTH_LOGIN_SUCCESS':
    case 'AUTH_SESSION_CREATED':
      return 'El usuario ingresó correctamente a la aplicación.';
    case 'AUTH_LOGIN_FAILED':
      return 'No se permitió el ingreso porque las credenciales no fueron válidas o la cuenta no estaba disponible.';
    case 'AUTH_ACCOUNT_LOCKED':
      return 'La cuenta quedó bloqueada temporalmente después de varios intentos fallidos de ingreso. Los administradores fueron notificados por correo si SMTP está configurado.';
    case 'USER_BLOCKED':
      return 'Un administrador bloqueó la cuenta y sus sesiones activas fueron cerradas. Los administradores fueron notificados por correo si SMTP está configurado.';
    case 'USER_UNBLOCKED':
      return 'Un administrador volvió a habilitar la cuenta.';
    case 'ACCESS_DENIED':
      return 'La aplicación impidió una acción porque el usuario no tenía los permisos necesarios.';
    case 'AUTHENTICATION_REJECTED':
      return 'La solicitud no tenía una sesión válida. Esto puede ocurrir cuando la sesión venció o fue cerrada.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'La aplicación detuvo temporalmente solicitudes repetidas para proteger el servicio.';
    case 'HTTP_SERVER_ERROR':
      return `La aplicación encontró un error al procesar ${routeDescription(route)}. El equipo técnico debe revisarlo.${durationText}`;
    case 'SERVICE_HEALTH_DEGRADED':
      return 'La supervisión interna detectó que la base de datos o la aplicación web no respondían. Los administradores fueron notificados por correo si SMTP está configurado.';
    case 'SERVICE_HEALTH_RECOVERED':
      return 'Los componentes afectados volvieron a responder. Los administradores recibieron el aviso de recuperación si SMTP está configurado.';
    default:
      if (status && status >= 400) {
        return 'La operación no pudo completarse y quedó registrada para su revisión.';
      }
      return 'La operación se completó y quedó registrada en el historial.';
  }
}

export function auditSeverityLabel(severity: AuditEvent['severity']): string {
  return ({
    info: 'Informativo',
    warning: 'Requiere revisión',
    error: 'Crítico',
  })[severity];
}
