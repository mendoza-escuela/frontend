FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g npm@11.6.1
ARG VITE_API_URL
ARG VITE_BRAND_MENDOZA_ON_LIGHT
ARG VITE_BRAND_MENDOZA_ON_BLUE
ARG VITE_BRAND_OPS_ON_LIGHT
ARG VITE_BRAND_OPS_ON_BLUE
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BRAND_MENDOZA_ON_LIGHT=$VITE_BRAND_MENDOZA_ON_LIGHT
ENV VITE_BRAND_MENDOZA_ON_BLUE=$VITE_BRAND_MENDOZA_ON_BLUE
ENV VITE_BRAND_OPS_ON_LIGHT=$VITE_BRAND_OPS_ON_LIGHT
ENV VITE_BRAND_OPS_ON_BLUE=$VITE_BRAND_OPS_ON_BLUE
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Imagen sin privilegios: el proceso corre como el usuario nginx (UID 101) y no
# como root (hallazgo H-07, detectado por Semgrep y Trivy de forma
# independiente).
#
# CAMBIO DE CONTRATO: un proceso no-root no puede abrir puertos por debajo de
# 1024, por eso el contenedor escucha en 8080 y ya no en 80. Todo compose,
# manifiesto o reverse proxy que apunte a este contenedor debe usar 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runner
ARG VITE_API_URL
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Cuando la API vive en otro dominio, la CSP permite únicamente su origen.
# Se descarta cualquier ruta: sólo se inserta scheme + host.
# nosemgrep: dockerfile.security.last-user-is-root.last-user-is-root -- SEC-EXC-006
USER root
RUN set -eu; \
    apk upgrade --no-cache; \
    case "${VITE_API_URL}" in \
      http://*|https://*) \
        api_origin="$(printf '%s' "${VITE_API_URL}" | sed -E 's#^(https?://[^/]+).*$#\1#')" \
        ;; \
      *) api_origin="" ;; \
    esac; \
    sed -i "s|__VITE_API_ORIGIN__|${api_origin}|g" /etc/nginx/conf.d/default.conf; \
    if grep -q '__VITE_API_ORIGIN__' /etc/nginx/conf.d/default.conf; then exit 1; fi
# La imagen base ya corre como nginx (UID 101). Se declara explícitamente
# para que quede asentado en el Dockerfile y Trivy pueda verificarlo (DS002).
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
