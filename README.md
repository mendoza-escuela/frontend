# Frontend - Escuelas Promotoras de Salud

Aplicación web React, TypeScript, Vite y Tailwind CSS.

## Requisitos

- Node.js `22.23.2` (declarado en `.nvmrc`).
- npm `11.6.1`.

## Desarrollo

1. Copiar `.env.example` a `.env`.
2. Configurar `VITE_API_URL` como `/api` para mismo origen o con una URL
   HTTP(S) terminada en `/api` (por ejemplo, `http://localhost:4000/api`). El
   cliente no agrega ese prefijo automáticamente.
3. Preparar el toolchain e instalar exactamente el lockfile:

   ```bash
   nvm use
   npm install --global npm@11.6.1
   npm ci
   npm run dev
   ```

Las variables `VITE_*` son configuración pública: Vite las incorpora al bundle
durante la compilación y no deben contener secretos. Cambiarlas en un contenedor
ya construido no modifica la aplicación; requiere generar una imagen nueva. El
Dockerfile usa `/api` como valor predeterminado de `VITE_API_URL`. Las cuatro
variables `VITE_BRAND_MENDOZA_*` y `VITE_BRAND_OPS_*` son overrides opcionales
de assets institucionales y también se definen mediante argumentos de build.

La autenticación usa cookies `HttpOnly`; por eso las solicitudes Axios se realizan con credenciales y el token no se guarda en `localStorage`.

El panel `/admin/usuarios` permite buscar, filtrar y paginar usuarios, crear y editar cuentas, bloquear accesos y restablecer contraseñas. `/admin/usuarios/importar` permite descargar la plantilla, previsualizar validaciones e importar parcialmente archivos CSV o XLSX.

El panel responsive `/admin/colegios` administra el padrón con búsqueda, filtros territoriales e institucionales, paginación y exportación CSV/Excel. Incluye alta y edición validadas, detalle con usuario asociado, accesos e historial, activación/desactivación e importación masiva con vista previa en `/admin/colegios/importar`.

Los listados administrativos de usuarios, colegios y cuestionarios usan paginación remota de 20 registros, muestran el rango consultado y cancelan solicitudes anteriores cuando cambia la página o los filtros. Los selectores de colegios y de usuarios disponibles también buscan y paginan en backend, por lo que el navegador no descarga colecciones completas.

El portal responsive `/colegio` ofrece Inicio, Mi establecimiento, Cuestionario y Resultados. Los datos institucionales son de consulta y provienen de `GET /schools/me`. En Cuestionario, las etapas abiertas se mantienen separadas de “Borradores vencidos”; estos últimos muestran período, progreso y último guardado y sólo pueden abrirse para consulta, sin acciones de guardado o envío.

En el detalle de `/colegio/resultados/:campaignId`, la escuela puede descargar el reporte PDF, el comprobante y un workbook Excel de su propia presentación. El Excel reúne resumen, resultados por dimensión y respuestas enviadas; el nombre proviene de `Content-Disposition` con un fallback seguro basado en el CUE.

En `/colegio/establecimiento`, el usuario revisa los datos territoriales, tipo de educación, jornada, niveles, matrícula, referentes y características institucionales. La confirmación anual exige los campos funcionales obligatorios, una jornada y al menos un nivel catalogados, además de respuestas conocidas para kiosco y comedor. El portal distingue si el período tiene una confirmación (`isConfirmed`) de si los datos históricos están completos para evaluar (`isEvaluationReady`), detalla `missingFields` cuando requieren actualización y envía los cambios mediante `PUT /schools/me/rectification`; el backend conserva el historial y la auditoría.

Si un editor recibe un tipo de educación histórico sin correspondencia en el catálogo oficial, conserva y muestra el valor anterior sin inferir equivalencias —por ejemplo, no convierte `Primario` en `Educación común`— y exige una selección oficial antes de guardar. La regularización masiva del padrón queda pendiente de un mapeo oficial por CUE.

Las nuevas etapas del flujo escolar consumen exclusivamente versiones institucionales elegibles. El instrumento institucional vigente admite preguntas de selección simple; una versión genérica puede editarse y publicarse para administración o consulta, pero no se ofrece al crear etapas ni llega a nuevas cargas escolares. El renderizador conserva compatibilidad de lectura con tipos históricos, sin ampliar por eso el contrato vigente del instrumento. El formulario navega por secciones y usa React Hook Form con Zod para las validaciones configuradas.

En `/colegio/cuestionario`, el portal lista etapas activas dentro de su período, informa bloqueos por establecimiento inactivo o por una ficha que todavía no está lista para evaluar y permite iniciar o recuperar la presentación de la escuela. Una confirmación anual incompleta no se presenta como pendiente: conserva su fecha y señala los campos que requieren actualización. El formulario admite avance parcial, restaura respuestas, muestra progreso, guarda manualmente, realiza autoguardado y confirma el envío definitivo. El autoguardado usa una cola de una sola escritura, coalesce al estado local más nuevo, espera el flush antes del envío o de una navegación SPA y detecta ediciones concurrentes mediante la revisión del backend. Si otra pestaña avanzó esa revisión, se detiene y exige recargar en lugar de sobrescribirla. Si una respuesta de guardado trae un cuestionario o una aplicabilidad autoritativa diferente, adopta ese contrato sin reponer respuestas antiguas, mantiene las ediciones locales y pausa el siguiente guardado hasta que la escuela lo revise. Después del envío se abre en modo de sólo lectura.

Las etapas pueden integrar recorridos ordenados. Aunque el administrador mantenga varias abiertas simultáneamente, el portal muestra el ciclo y el número de paso, identifica como bloqueada una etapa con requisitos anteriores y explica cuál debe enviarse. Sólo cuentan las etapas asignadas al colegio: una etapa no aplicable no interrumpe su recorrido.

El panel `/admin/cuestionarios` incorpora el ABM de cuestionarios y versiones. Permite crear versiones con las seis dimensiones oficiales, vacías o clonadas; editar la estructura y los puntajes; validar antes de publicar; consultar auditoría; comparar versiones, incluido el puntaje; y abrir una vista previa administrativa que muestra los puntos sin exponerlos en el portal escolar. Las versiones publicadas son de sólo lectura. El editor conserva los UUID de cada nodo al renombrar, mover o reordenar, envía la revisión cargada para impedir sobrescrituras concurrentes y avisa antes de navegar con cambios pendientes. Ante un conflicto mantiene la edición local visible hasta que el administrador decida recargar la versión vigente.

El editor de reglas conserva el trabajo sobre una pregunta y suma el modo “Varias preguntas”. En este modo el administrador marca dos o más preguntas con un selector buscable y aplica la misma regla sin reemplazar sus reglas existentes. La prioridad se agrega independientemente al final de cada pregunta; las tareas posteriores de edición, eliminación, orden y prueba se realizan desde el modo individual. El listado adopta las reglas y la revisión entregadas por un mismo snapshot del backend; cada alta, edición, baja o reordenamiento envía esa revisión y adopta la nueva cabecera de respuesta. Si otra persona modificó la versión, el backend responde conflicto, la pantalla no sobrescribe y conserva el formulario hasta que el administrador decida cargar la versión actual.

El panel `/admin/campanas` permite crear etapas anuales o semestrales, asociarlas únicamente a una versión institucional publicada y evaluable, buscarlas y filtrarlas. Las versiones genéricas publicadas se conservan para administración o consulta, pero no aparecen como elegibles para etapas escolares. Los borradores pueden editarse o eliminarse y luego recorren el ciclo irreversible Activa, Cerrada y Archivada. La interfaz informa que la fecha final cierra a las 23:59:59 de Mendoza.

Al crear o editar un borrador, el administrador puede dejarlo independiente o indicar un nombre de recorrido y un orden entre 1 y 100. El formulario reutiliza los recorridos existentes y el listado identifica visualmente el ciclo y el paso configurados.

El dashboard `/admin/participacion` permite seguir por etapa el total de escuelas asignadas, las no iniciadas, los borradores, los envíos y el porcentaje de participación. Etapa es una selección única; los filtros territoriales, institucionales, de estado, estrellas y áreas críticas son multiselección y se conservan en la URL como claves repetidas. Departamento y localidad actualizan las opciones dependientes. “Nivel” usa los códigos del catálogo oficial y “Tipo de educación” conserva el dato institucional legado. El área crítica global restringe todos los indicadores y exportaciones, mientras que el selector de dimensión dentro del panel de alertas sólo refina ese listado. Las solicitudes anteriores se cancelan cuando el administrador cambia rápidamente los filtros.

El mismo dashboard permite comparar la etapa de referencia con hasta cinco períodos adicionales, conservados en la URL y evaluados con los mismos filtros territoriales e institucionales. Los filtros por estado de carga, estrellas y área crítica no se aplican a esta consulta porque seleccionarían cada etapa por su propio resultado. Puntaje general y distribución de estrellas se presentan como métricas históricas estandarizadas; cada período informa su propio universo y cobertura sin calcular variaciones de cohorte entre bases independientes. La superposición del radar sólo se habilita al seleccionar exactamente una escuela y muestra la metadata de comparabilidad entregada por backend. Si cambiaron el cuestionario o el algoritmo, la trayectoria se identifica explícitamente como descriptiva y mantiene una alternativa tabular accesible; la configuración de evaluación se conserva como trazabilidad de estrellas y alertas.

Desde el detalle de un cuestionario se accede a `/admin/cuestionarios/:surveyId/importar`. Allí se descargan plantillas CSV/Excel, se previsualizan errores por fila y se crea una versión borrador únicamente cuando la planilla completa es válida. El perfil institucional restringe el editor a selección simple y no ofrece “Otro”, “No aplica”, selección múltiple ni campos de observaciones.

Las pantallas administrativas reutilizan componentes comunes para encabezados, cards, campos, estados de carga/error/vacío, badges, modales y confirmaciones. Los accesos HTTP permanecen centralizados en `src/services/admin-surveys.service.ts`.

Las páginas públicas, administrativas y del portal escolar se cargan bajo demanda mediante `React.lazy`, reduciendo el JavaScript inicial y evitando descargar módulos que el usuario todavía no visitó.

Los errores de navegación, permisos, sesión y disponibilidad usan páginas institucionales reutilizables para 401, 403, 404, 500, 503 y un estado genérico. React Router, el boundary raíz y Axios están integrados sin reemplazar las validaciones, toasts ni errores recuperables propios de formularios. El contrato y los criterios de seguridad se documentan en [`docs/error-pages.md`](docs/error-pages.md).

La paleta institucional se centraliza mediante tokens `mendoza-*` en `src/styles/index.css` y constantes para gráficos en `src/theme/institutional-theme.ts`. La interfaz usa azul `#000F9F` como primario, celeste `#3CB4E5` como apoyo, dorado `#C8A977` como acento y la familia REM con fallbacks del sistema. La procedencia de logos, variantes, tipografía, contraste, impresión y movimiento reducido se documenta en [`docs/identity-visual.md`](docs/identity-visual.md).

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run lint` sólo informa hallazgos. Para aplicar correcciones automáticas de
Oxlint de forma explícita se usa `npm run lint:fix`.
