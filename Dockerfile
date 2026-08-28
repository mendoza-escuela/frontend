FROM node:26-alpine AS build
WORKDIR /app
RUN npm install -g npm@11.6.1
ARG VITE_API_URL
ARG VITE_BRAND_MENDOZA_ON_LIGHT
ARG VITE_BRAND_MENDOZA_ON_BLUE
ARG VITE_BRAND_HEALTH_ON_LIGHT
ARG VITE_BRAND_HEALTH_ON_BLUE
ARG VITE_BRAND_DGE_ON_LIGHT
ARG VITE_BRAND_DGE_ON_BLUE
ARG VITE_BRAND_OPS_ON_LIGHT
ARG VITE_BRAND_OPS_ON_BLUE
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BRAND_MENDOZA_ON_LIGHT=$VITE_BRAND_MENDOZA_ON_LIGHT
ENV VITE_BRAND_MENDOZA_ON_BLUE=$VITE_BRAND_MENDOZA_ON_BLUE
ENV VITE_BRAND_HEALTH_ON_LIGHT=$VITE_BRAND_HEALTH_ON_LIGHT
ENV VITE_BRAND_HEALTH_ON_BLUE=$VITE_BRAND_HEALTH_ON_BLUE
ENV VITE_BRAND_DGE_ON_LIGHT=$VITE_BRAND_DGE_ON_LIGHT
ENV VITE_BRAND_DGE_ON_BLUE=$VITE_BRAND_DGE_ON_BLUE
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
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# La imagen base ya corre como nginx (UID 101). Se declara explícitamente
# para que quede asentado en el Dockerfile y Trivy pueda verificarlo (DS002).
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
