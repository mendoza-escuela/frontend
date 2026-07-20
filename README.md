# Frontend - Escuelas Promotoras de Salud

Aplicación web React, TypeScript, Vite y Tailwind CSS.

## Desarrollo

1. Copiar `.env.example` a `.env`.
2. Configurar `VITE_API_URL` con la URL del backend.
3. Ejecutar `npm install` y `npm run dev`.

La autenticación usa cookies `HttpOnly`; por eso las solicitudes Axios se realizan con credenciales y el token no se guarda en `localStorage`.

## Verificación

```bash
npm run lint
npm test
npm run build
```
