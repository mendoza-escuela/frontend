# Páginas y manejo de errores

La aplicación centraliza los errores de navegación y disponibilidad en
`ErrorPage`. Las rutas públicas soportadas son:

- `/error/401`: sesión finalizada.
- `/error/403`: acceso sin permisos.
- `/error/404`: página o recurso no encontrado.
- `/error/500`: error interno inesperado.
- `/error/503`: servicio temporalmente no disponible.
- `/error`: estado genérico.

Una URL sin ruta muestra el estado 404 sin reemplazar la dirección ingresada.
El `errorElement` de React Router y `AppErrorBoundary` evitan que un error de
render o de carga diferida exponga mensajes, stack traces o rutas internas.

La instancia Axios eleva a una página global los errores 403, 5xx y de red de
solicitudes GET/HEAD. Se excluyen cancelaciones, descargas y mutaciones para
preservar el contexto de formularios, toasts y estados inline. Los 404 de
recursos siguen siendo responsabilidad de cada pantalla porque pueden
representar estados funcionales válidos.

Una respuesta 401 fuera de los endpoints públicos de autenticación invalida la
sesión. Si había una persona autenticada, el guard abre `/error/401`; el botón
de login conserva únicamente una ruta interna validada para volver después de
autenticarse.

Los textos de las páginas son fijos. Nunca se debe pasar a `ErrorPage` el
mensaje técnico, stack o payload completo de una excepción. Sólo se presenta
un identificador de correlación explícito con formato alfanumérico seguro,
cuando la API lo entrega.
