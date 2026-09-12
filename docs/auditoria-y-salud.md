# Auditoría y salud

Ruta: `/admin/auditoria`, accesible desde la navegación del administrador. El backend aplica JWT y rol admin; ocultar la ruta en frontend no es el control de seguridad.

La pantalla permite filtrar por código de evento, severidad, UUID del usuario, UUID de solicitud y fechas. Muestra eventos paginados, fecha local, servicio, origen y detalles como texto escapado de React. No permite editar ni borrar registros.

Las tarjetas muestran salud actual, última señal del monitor externo, alertas a administradores por correo y protección/retención de auditoría. Las señales antiguas, SMTP ausente, destinatarios vacíos, fallos de envío y cuentas SQL privilegiadas aparecen como pendientes, no como controles cumplidos.

La información se actualiza cada minuto cuando la pestaña está visible y mediante el botón Actualizar. Un fallo de consulta retira los datos de disponibilidad anteriores. Todas las solicitudes pasan por el servicio centralizado y Axios con cancelación.

Se reutilizan PageHeader, Card, Button, LoadingState, ErrorState y PaginationControls, con los tokens institucionales Mendoza y Lucide. Los filtros usan React Hook Form y Zod. No hay nuevos assets ni dependencias.

La configuración, migraciones, responsables y prueba operativa se documentan en `backend/docs/auditoria-y-monitoreo.md` del repositorio backend. El envío real requiere SMTP y desplegar el monitor separado.
