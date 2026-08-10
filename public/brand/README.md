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

Antes de incorporar un archivo se debe copiar
`assets-manifest.example.json`, registrar su SHA-256 y completar todos los
campos. Luego se configura la ruta pública correspondiente en `.env` mediante
las variables `VITE_BRAND_*`.

Si una ruta no está configurada o la imagen no carga, la aplicación muestra el
nombre del organismo en texto. No reemplazar ese fallback con una recreación.

Los archivos `src/assets/eps-icon.svg` y `eps-logo-horizontal.svg` corresponden
a la identificación visual propia de la aplicación existente; no son ni deben
presentarse como escudos o logos oficiales de los organismos.
