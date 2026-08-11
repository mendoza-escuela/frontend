# Assets institucionales oficiales

Esta carpeta está reservada exclusivamente para archivos oficiales entregados
por los organismos participantes. No contiene logos extraídos de manuales PDF,
capturas, redibujos ni aproximaciones.

## Estructura esperada

```text
brand/
├── README.md
├── assets-manifest.example.json
└── official/
    ├── mendoza/
    ├── salud/
    ├── dge/
    └── ops/
```

Cada organismo debe aportar, cuando corresponda:

- variante para fondo claro;
- variante autorizada para fondo azul u oscuro;
- formato SVG original o PNG de resolución suficiente;
- documento o URL de procedencia;
- responsable y fecha de entrega;
- condiciones de uso y licencia.

Los archivos actualmente versionados fueron entregados por el cliente y están
autorizados de manera provisoria. Su procedencia, uso y SHA-256 se registran en
`assets-manifest.json`; deberán reemplazarse cuando el cliente entregue las
variantes definitivas.

La aplicación usa como valores predeterminados:

- `/brand/official/mendoza/marca-gobierno-mendoza.png` para Gobierno de
  Mendoza;
- `/brand/official/ops/ops-horizontal.avif` para OPS/OMS, con
  `/brand/official/ops/oms-ops.jpg` como respaldo;
- `/brand/official/mendoza/simbolo-mendoza.png` como favicon.

Las rutas de Mendoza y OPS/OMS pueden reemplazarse sin modificar código
mediante `VITE_BRAND_MENDOZA_ON_LIGHT`, `VITE_BRAND_MENDOZA_ON_BLUE`,
`VITE_BRAND_OPS_ON_LIGHT` y `VITE_BRAND_OPS_ON_BLUE`. Si una variante
configurada falla, primero se intenta el asset provisorio versionado y, si
tampoco carga, se muestra la identificación textual.

Todavía no se recibieron assets específicos de Salud ni de la Dirección
General de Escuelas; ambos organismos conservan su fallback textual. Como no
hay variantes autorizadas para fondos azules, los logos disponibles se
presentan dentro de un contenedor claro, sin recolorearlos ni deformarlos.

Antes de incorporar futuros archivos se debe actualizar
`assets-manifest.json`, registrar su SHA-256 y completar procedencia,
responsable, fecha y condiciones de uso. No reemplazar los fallbacks con una
recreación.

Los archivos `src/assets/eps-icon.svg` y `eps-logo-horizontal.svg` corresponden
a la identificación visual propia de la aplicación existente; no son ni deben
presentarse como escudos o logos oficiales de los organismos.
