#!/bin/sh
set -eu

api_url="${VITE_API_URL:-/api}"

case "$api_url" in
  /api|/api/)
    api_origin=""
    ;;
  http://*|https://*)
    if ! printf '%s' "$api_url" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~%/-]+)*/api/*$'; then
      echo 'VITE_API_URL debe ser /api o una URL HTTP(S) sin credenciales, query ni fragmento y terminada en /api.' >&2
      exit 1
    fi
    api_origin="$(printf '%s' "$api_url" | sed -E 's#^(https?://[^/]+).*$#\1#')"
    ;;
  *)
    echo 'VITE_API_URL debe ser /api o una URL HTTP(S) terminada en /api.' >&2
    exit 1
    ;;
esac

encode() {
  printf '%s' "$1" | base64 | tr -d '\n'
}

# Base64 mantiene los valores fuera del código JavaScript generado y evita que
# comillas u otros caracteres de una variable alteren su estructura.
cat > /usr/share/nginx/html/runtime-config.js <<EOF
(() => {
  const decode = (value) => new TextDecoder().decode(Uint8Array.from(atob(value), (character) => character.charCodeAt(0)));
  window.__APP_CONFIG__ = {
    VITE_API_URL: decode("$(encode "$api_url")"),
    VITE_BRAND_MENDOZA_ON_LIGHT: decode("$(encode "${VITE_BRAND_MENDOZA_ON_LIGHT:-}")"),
    VITE_BRAND_MENDOZA_ON_BLUE: decode("$(encode "${VITE_BRAND_MENDOZA_ON_BLUE:-}")"),
    VITE_BRAND_OPS_ON_LIGHT: decode("$(encode "${VITE_BRAND_OPS_ON_LIGHT:-}")"),
    VITE_BRAND_OPS_ON_BLUE: decode("$(encode "${VITE_BRAND_OPS_ON_BLUE:-}")")
  };
})();
EOF

sed "s|__VITE_API_ORIGIN__|${api_origin}|g" \
  /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

if grep -q '__VITE_API_ORIGIN__' /etc/nginx/conf.d/default.conf; then
  echo 'No se pudo materializar la política CSP del frontend.' >&2
  exit 1
fi
