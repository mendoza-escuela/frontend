# Frontend - Escuelas Promotoras de Salud

Aplicación web React, TypeScript, Vite y Tailwind CSS.

## Desarrollo

1. Copiar `.env.example` a `.env`.
2. Configurar `VITE_API_URL` con la URL del backend.
3. Ejecutar `npm install` y `npm run dev`.

La autenticación usa cookies `HttpOnly`; por eso las solicitudes Axios se realizan con credenciales y el token no se guarda en `localStorage`.

El panel `/admin/usuarios` permite buscar, filtrar y paginar usuarios, crear y editar cuentas, bloquear accesos y restablecer contraseñas. `/admin/usuarios/importar` permite descargar la plantilla, previsualizar validaciones e importar parcialmente archivos CSV o XLSX.

El panel responsive `/admin/colegios` administra el padrón con búsqueda, filtros territoriales e institucionales, paginación y exportación CSV/Excel. Incluye alta y edición validadas, detalle con usuario asociado, accesos e historial, activación/desactivación e importación masiva con vista previa en `/admin/colegios/importar`.

## Verificación

```bash
npm run lint
npm test
npm run build
```
