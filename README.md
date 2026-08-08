# Frontend - Escuelas Promotoras de Salud

Aplicación web React, TypeScript, Vite y Tailwind CSS.

## Desarrollo

1. Copiar `.env.example` a `.env`.
2. Configurar `VITE_API_URL` con la URL base de la API, incluido el prefijo `/api` (por ejemplo, `http://localhost:4000/api`).
3. Ejecutar `npm install` y `npm run dev`.

La autenticación usa cookies `HttpOnly`; por eso las solicitudes Axios se realizan con credenciales y el token no se guarda en `localStorage`.

El panel `/admin/usuarios` permite buscar, filtrar y paginar usuarios, crear y editar cuentas, bloquear accesos y restablecer contraseñas. `/admin/usuarios/importar` permite descargar la plantilla, previsualizar validaciones e importar parcialmente archivos CSV o XLSX.

El panel responsive `/admin/colegios` administra el padrón con búsqueda, filtros territoriales e institucionales, paginación y exportación CSV/Excel. Incluye alta y edición validadas, detalle con usuario asociado, accesos e historial, activación/desactivación e importación masiva con vista previa en `/admin/colegios/importar`.

Los listados administrativos de usuarios, colegios y cuestionarios usan paginación remota de 20 registros, muestran el rango consultado y cancelan solicitudes anteriores cuando cambia la página o los filtros. Los selectores de colegios y de usuarios disponibles también buscan y paginan en backend, por lo que el navegador no descarga colecciones completas.

El portal responsive `/colegio` ofrece Inicio, Mi establecimiento, Cuestionario y Resultados. Los datos institucionales son de consulta y provienen de `GET /schools/me`.

En `/colegio/establecimiento`, el usuario revisa los ocho datos obligatorios de la ficha y confirma su rectificación para el año calendario. El portal informa si el período vigente está rectificado y envía los cambios mediante `PUT /schools/me/rectification`; el backend conserva el historial y la auditoría.

El renderizador de cuestionarios consume una versión publicada y soporta selección simple, selección múltiple, sí/no, texto corto, texto largo, número y fecha. Navega por secciones y usa React Hook Form con Zod para las validaciones configuradas.

En `/colegio/cuestionario`, el portal lista campañas activas dentro de su período, informa bloqueos por establecimiento inactivo o rectificación anual pendiente y permite iniciar o recuperar la presentación de la escuela. El formulario admite avance parcial, restaura respuestas, muestra progreso, guarda manualmente, realiza autoguardado y confirma el envío definitivo. Después del envío se abre en modo de sólo lectura.

El panel `/admin/cuestionarios` incorpora el ABM de cuestionarios y versiones. Permite crear versiones con las seis dimensiones oficiales, vacías o clonadas; editar la estructura y los puntajes; validar antes de publicar; consultar auditoría; comparar versiones, incluido el puntaje; y abrir una vista previa administrativa que muestra los puntos sin exponerlos en el portal escolar. Las versiones publicadas son de sólo lectura.

El panel `/admin/campanas` permite crear campañas anuales o semestrales, asociarlas a una versión publicada, buscarlas y filtrarlas. Los borradores pueden editarse o eliminarse y luego recorren el ciclo irreversible Activa, Cerrada y Archivada. La interfaz informa que la fecha final cierra a las 23:59:59 de Mendoza.

El dashboard `/admin/participacion` permite seguir por campaña el total de escuelas activas, las no iniciadas, los borradores, los envíos y el porcentaje de participación. Los filtros de campaña, ubicación y características institucionales se conservan en la URL; departamento y localidad actualizan las opciones dependientes. Las solicitudes anteriores se cancelan cuando el administrador cambia rápidamente los filtros.

Desde el detalle de un cuestionario se accede a `/admin/cuestionarios/:surveyId/importar`. Allí se descargan plantillas CSV/Excel, se previsualizan errores por fila y se crea una versión borrador únicamente cuando la planilla completa es válida. El perfil institucional restringe el editor a selección simple y no ofrece “Otro”, “No aplica”, selección múltiple ni campos de observaciones.

Las pantallas administrativas reutilizan componentes comunes para encabezados, cards, campos, estados de carga/error/vacío, badges, modales y confirmaciones. Los accesos HTTP permanecen centralizados en `src/services/admin-surveys.service.ts`.

Las páginas públicas, administrativas y del portal escolar se cargan bajo demanda mediante `React.lazy`, reduciendo el JavaScript inicial y evitando descargar módulos que el usuario todavía no visitó.

La paleta institucional se centraliza mediante tokens `mendoza-*` en `src/styles/index.css`. La interfaz usa azul `#000F9F` como primario, celeste `#3CB4E5` como apoyo, dorado `#C8A977` como acento y la familia REM con fallbacks del sistema.

## Verificación

```bash
npm run lint
npm test
npm run build
```
