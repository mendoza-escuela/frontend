FROM node:22.23.2-alpine3.24 AS build
WORKDIR /app
RUN npm install -g npm@11.6.1
ENV VITE_API_URL=/api
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
ENV VITE_API_URL=/api
COPY --from=build /app/dist /usr/share/nginx/html
USER root
RUN set -eu; \
    apk upgrade --no-cache; \
    rm -f /etc/nginx/conf.d/default.conf; \
    touch /etc/nginx/conf.d/default.conf /usr/share/nginx/html/runtime-config.js; \
    chown nginx:nginx /etc/nginx/conf.d/default.conf /usr/share/nginx/html/runtime-config.js
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
# La imagen base ya corre como nginx (UID 101). Se declara explícitamente
# para que quede asentado en el Dockerfile y Trivy pueda verificarlo (DS002).
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
