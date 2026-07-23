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

El renderizador de cuestionarios consume la última versión publicada y soporta selección simple, selección múltiple, sí/no, texto corto, texto largo, número y fecha. Navega por secciones y usa React Hook Form con Zod para las validaciones configuradas. En el portal permanece en modo de sólo lectura hasta que estén implementados campañas, borradores y envíos; no simula persistencia ni resultados.

El panel `/admin/cuestionarios` incorpora el ABM de cuestionarios y versiones. Permite crear versiones vacías o clonadas, editar la estructura anidada y su orden, guardar borradores incompletos, validar todos los errores antes de publicar, publicar con confirmación, eliminar únicamente borradores, consultar la auditoría, comparar dos versiones y abrir una vista previa con el mismo renderizador que utiliza el portal escolar. Las versiones publicadas se muestran en modo de sólo lectura.

Las pantallas administrativas reutilizan componentes comunes para encabezados, cards, campos, estados de carga/error/vacío, badges, modales y confirmaciones. Los accesos HTTP permanecen centralizados en `src/services/admin-surveys.service.ts`.

Las páginas públicas, administrativas y del portal escolar se cargan bajo demanda mediante `React.lazy`, reduciendo el JavaScript inicial y evitando descargar módulos que el usuario todavía no visitó.

La paleta institucional se centraliza mediante tokens `mendoza-*` en `src/styles/index.css`. La interfaz usa azul `#000F9F` como primario, celeste `#3CB4E5` como apoyo, dorado `#C8A977` como acento y la familia REM con fallbacks del sistema.

## Verificación

```bash
npm run lint
npm test
npm run build
```
