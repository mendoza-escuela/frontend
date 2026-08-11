# Identidad visual institucional

## Implementación vigente

La interfaz utiliza los tokens oficiales definidos en `src/styles/index.css`:

- azul institucional `#000F9F`;
- celeste `#3CB4E5`;
- dorado `#C8A977`;
- fondo `#F7F4EF`;
- texto `#1F2937`;
- tipografía `REM, Inter, system-ui, sans-serif`.

Los componentes TypeScript que no pueden consumir variables CSS —por ejemplo
Recharts y SVG— importan `INSTITUTIONAL_COLORS` o
`INSTITUTIONAL_CHART_COLORS` desde `src/theme/institutional-theme.ts`. No deben
declarar colores hexadecimales localmente.

Los PDF usan los mismos colores desde
`backend/src/modules/reports/report-theme.ts`. El azul es la serie y acción
principal, el celeste la serie secundaria y el dorado se reserva para
clasificación y certificación. El rojo sólo representa alertas críticas.

## Accesibilidad y salida impresa

- Una prueba automatizada verifica contraste WCAG AA para texto principal,
  texto secundario, blanco sobre azul y azul sobre el fondo institucional.
- El foco visible combina un contorno blanco y un anillo azul para seguir
  siendo perceptible sobre superficies claras y azules.
- `prefers-reduced-motion: reduce` desactiva animaciones, transiciones y scroll
  suave globalmente.
- La hoja de impresión elimina navegación, controles, sombras y animaciones;
  usa A4 y conserva encabezados de tablas y colores institucionales.
- Los gráficos mantienen una alternativa textual o tabular accesible.

## Marcas y assets

`InstitutionalBrand` admite una variante por organismo para fondo claro y otra
para fondo azul. Gobierno de Mendoza y OPS/OMS utilizan por defecto los assets
provisorios versionados bajo `public/brand/official/`. OPS/OMS prioriza AVIF y
usa el JPG entregado como respaldo. El símbolo de Mendoza se utiliza como
favicon.

Las rutas pueden reemplazarse sin modificar código mediante las variables
`VITE_BRAND_MENDOZA_ON_LIGHT`, `VITE_BRAND_MENDOZA_ON_BLUE`,
`VITE_BRAND_OPS_ON_LIGHT` y `VITE_BRAND_OPS_ON_BLUE`. También están previstas
las variables equivalentes de Salud y DGE para cuando se reciban esos assets.
Si una imagen configurada falla, se intenta el asset provisorio disponible y,
en última instancia, se muestra el nombre textual del organismo.

Los assets oficiales deben ubicarse bajo `public/brand/official/` y contar con
un manifiesto que registre fuente, responsable, fecha, licencia, aprobación y
SHA-256. No se admite:

- extraer imágenes de manuales PDF;
- recortar capturas;
- redibujar o aproximar logos;
- deformar variantes para adaptarlas a otro fondo;
- presentar la marca propia de la aplicación como logo de un organismo.

Los archivos de Gobierno de Mendoza y OPS/OMS fueron entregados por el cliente
para uso provisorio y están documentados en `public/brand/assets-manifest.json`.
Todavía no se recibieron logos específicos de Salud ni DGE, que conservan su
fallback textual. Tampoco se recibieron variantes autorizadas para fondos
azules: en esas superficies las imágenes disponibles se muestran dentro de un
contenedor blanco, sin recolorearlas ni deformarlas.

## Tipografía REM

No se recibió ni versionó ningún archivo de fuente REM. REM se usa si el
sistema del usuario la tiene disponible y, de lo contrario, se aplican los
fallbacks declarados.

Para autocontener REM se necesitan los archivos oficiales web (`woff2`), la
licencia que autorice redistribución, procedencia, hash y aprobación. Sólo
después de completar esos datos puede agregarse un `@font-face`. Los PDF
continúan usando Helvetica estándar mientras esa autorización no exista.
