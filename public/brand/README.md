# Assets institucionales oficiales

Esta carpeta está reservada exclusivamente para archivos oficiales entregados
por los organismos participantes. No contiene logos extraídos de manuales PDF,
capturas, redibujos ni aproximaciones.

## Estructura esperada

```text
brand/
├── README.md
├── assets-manifest.json
└── official/
    ├── mendoza/
    └── ops/
```

Cada organismo debe aportar, cuando corresponda:

- variante para fondo claro;
- variante autorizada para fondo azul u oscuro;
- formato SVG original o PNG de resolución suficiente;
- documento o URL de procedencia;
- responsable y fecha de entrega;
- condiciones de uso y licencia.

Los archivos actualmente versionados fueron entregados por el cliente. Su
procedencia, uso y SHA-256 se registran en `assets-manifest.json`.

La aplicación usa como valores predeterminados:

- `/brand/official/mendoza/marca-gobierno-mendoza.png` para Gobierno de
  Mendoza;
- `/brand/official/eps/eps-mendoza.jpg` para Escuelas Promotoras de Salud
  Mendoza en login y cabeceras del portal;
- `/brand/official/ops/ops-blue-horizontal.png` para OPS sobre fondos claros;
- `/brand/official/ops/ops-white-stacked.png` para OPS en espacios angostos
  sobre fondos azules u oscuros;
- `/brand/official/mendoza/simbolo-mendoza.png` como favicon.

Las rutas de Mendoza y OPS pueden reemplazarse sin modificar código
mediante `VITE_BRAND_MENDOZA_ON_LIGHT`, `VITE_BRAND_MENDOZA_ON_BLUE`,
`VITE_BRAND_OPS_ON_LIGHT` y `VITE_BRAND_OPS_ON_BLUE`. Si una variante
configurada falla, primero se intenta el asset autorizado versionado y, si
tampoco carga, se muestra la identificación textual.

Las seis variantes autorizadas de OPS —horizontal y apilada en azul, blanco y
negro— están disponibles en `official/ops/`. La interfaz selecciona la variante
adecuada sin recolorearla ni deformarla.

Antes de incorporar futuros archivos se debe actualizar
`assets-manifest.json`, registrar su SHA-256 y completar procedencia,
responsable, fecha y condiciones de uso. No reemplazar los fallbacks con una
recreación.

El asset autorizado de Escuelas Promotoras conserva el formato JPEG provisto
por el cliente y se muestra sobre las superficies claras del diseño sin
recortes, recoloreados ni deformaciones.
