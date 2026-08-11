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

En el detalle de `/colegio/resultados/:campaignId`, la escuela puede descargar el reporte PDF, el comprobante y un workbook Excel de su propia presentación. El Excel reúne resumen, resultados por dimensión y respuestas enviadas; el nombre proviene de `Content-Disposition` con un fallback seguro basado en el CUE.

En `/colegio/establecimiento`, el usuario revisa los datos territoriales, tipo de educación, jornada, niveles, matrícula, referentes y características institucionales. La rectificación exige los campos funcionales obligatorios, una jornada y al menos un nivel catalogados, además de respuestas conocidas para kiosco y comedor. El portal informa si el período vigente está rectificado y envía los cambios mediante `PUT /schools/me/rectification`; el backend conserva el historial y la auditoría.

El renderizador de cuestionarios consume una versión publicada y soporta selección simple, selección múltiple, sí/no, texto corto, texto largo, número y fecha. Navega por secciones y usa React Hook Form con Zod para las validaciones configuradas.

En `/colegio/cuestionario`, el portal lista campañas activas dentro de su período, informa bloqueos por establecimiento inactivo o rectificación anual pendiente y permite iniciar o recuperar la presentación de la escuela. El formulario admite avance parcial, restaura respuestas, muestra progreso, guarda manualmente, realiza autoguardado y confirma el envío definitivo. Después del envío se abre en modo de sólo lectura.

El panel `/admin/cuestionarios` incorpora el ABM de cuestionarios y versiones. Permite crear versiones con las seis dimensiones oficiales, vacías o clonadas; editar la estructura y los puntajes; validar antes de publicar; consultar auditoría; comparar versiones, incluido el puntaje; y abrir una vista previa administrativa que muestra los puntos sin exponerlos en el portal escolar. Las versiones publicadas son de sólo lectura.

El panel `/admin/campanas` permite crear campañas anuales o semestrales, asociarlas a una versión publicada, buscarlas y filtrarlas. Los borradores pueden editarse o eliminarse y luego recorren el ciclo irreversible Activa, Cerrada y Archivada. La interfaz informa que la fecha final cierra a las 23:59:59 de Mendoza.

El dashboard `/admin/participacion` permite seguir por campaña el total de escuelas asignadas, las no iniciadas, los borradores, los envíos y el porcentaje de participación. Campaña es una selección única; los filtros territoriales, institucionales, de estado, estrellas y áreas críticas son multiselección y se conservan en la URL como claves repetidas. Departamento y localidad actualizan las opciones dependientes. “Nivel” usa los códigos del catálogo oficial y “Tipo de educación” conserva el dato institucional legado. El área crítica global restringe todos los indicadores y exportaciones, mientras que el selector de dimensión dentro del panel de alertas sólo refina ese listado. Las solicitudes anteriores se cancelan cuando el administrador cambia rápidamente los filtros.

El mismo dashboard permite comparar la campaña de referencia con hasta cinco períodos adicionales, conservados en la URL y evaluados con los mismos filtros territoriales e institucionales. Los filtros por estado de carga, estrellas y área crítica no se aplican a esta consulta porque seleccionarían cada campaña por su propio resultado. Puntaje general y distribución de estrellas se presentan como métricas históricas estandarizadas; cada período informa su propio universo y cobertura sin calcular variaciones de cohorte entre bases independientes. La superposición del radar sólo se habilita al seleccionar exactamente una escuela y muestra la metadata de comparabilidad entregada por backend. Si cambiaron el cuestionario o el algoritmo, la trayectoria se identifica explícitamente como descriptiva y mantiene una alternativa tabular accesible; la configuración de evaluación se conserva como trazabilidad de estrellas y alertas.

Desde el detalle de un cuestionario se accede a `/admin/cuestionarios/:surveyId/importar`. Allí se descargan plantillas CSV/Excel, se previsualizan errores por fila y se crea una versión borrador únicamente cuando la planilla completa es válida. El perfil institucional restringe el editor a selección simple y no ofrece “Otro”, “No aplica”, selección múltiple ni campos de observaciones.

Las pantallas administrativas reutilizan componentes comunes para encabezados, cards, campos, estados de carga/error/vacío, badges, modales y confirmaciones. Los accesos HTTP permanecen centralizados en `src/services/admin-surveys.service.ts`.

Las páginas públicas, administrativas y del portal escolar se cargan bajo demanda mediante `React.lazy`, reduciendo el JavaScript inicial y evitando descargar módulos que el usuario todavía no visitó.

Los errores de navegación, permisos, sesión y disponibilidad usan páginas institucionales reutilizables para 401, 403, 404, 500, 503 y un estado genérico. React Router, el boundary raíz y Axios están integrados sin reemplazar las validaciones, toasts ni errores recuperables propios de formularios. El contrato y los criterios de seguridad se documentan en [`docs/error-pages.md`](docs/error-pages.md).

La paleta institucional se centraliza mediante tokens `mendoza-*` en `src/styles/index.css` y constantes para gráficos en `src/theme/institutional-theme.ts`. La interfaz usa azul `#000F9F` como primario, celeste `#3CB4E5` como apoyo, dorado `#C8A977` como acento y la familia REM con fallbacks del sistema. La procedencia de logos, variantes, tipografía, contraste, impresión y movimiento reducido se documenta en [`docs/identity-visual.md`](docs/identity-visual.md).

## Verificación

```bash
npm run lint
npm test
npm run build
```
