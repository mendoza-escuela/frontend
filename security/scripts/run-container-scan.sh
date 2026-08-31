#!/usr/bin/env bash
# =============================================================================
# Construye la imagen desplegable del frontend y la analiza con Trivy.
#
# La imagen se etiqueta con el SHA del commit para que el informe indique
# exactamente qué artefacto se auditó: sin eso, "la imagen no tiene CVEs
# críticos" no significa nada.
#
# Uso:
#   ./security/scripts/run-container-scan.sh
#
# Este repositorio no construye ni declara cobertura sobre la imagen backend.
# El escaneo integrado de ambas imágenes vive en el pipeline del backend.
#
# Variables:
#   SECURITY_VITE_API_URL  URL pública de API embebida en el bundle (por defecto /api)
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORTS_DIR="${REPO_ROOT}/security/reports"
CONFIG_DIR="${REPO_ROOT}/security/config"
VITE_API_URL="${SECURITY_VITE_API_URL:-/api}"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) export MSYS_NO_PATHCONV=1 ;;
esac

# shellcheck source=/dev/null
set -a && . "${CONFIG_DIR}/tool-versions.env" && set +a

mkdir -p "${REPORTS_DIR}"
rm -f \
  "${REPORTS_DIR}/trivy-frontend-image.json" \
  "${REPORTS_DIR}/sbom-frontend-image.cyclonedx.json" \
  "${REPORTS_DIR}/container-scan-metadata.json"

git_meta() { (cd "$1" 2>/dev/null && git rev-parse HEAD 2>/dev/null) || echo "sin-git"; }

FRONTEND_SHA="$(git_meta "${REPO_ROOT}")"
FRONTEND_IMAGE="app-frontend:${FRONTEND_SHA:0:12}"

log() { printf '\n\033[1m[%s]\033[0m %s\n' "$1" "$2"; }

STATUS=0

# -----------------------------------------------------------------------------
build_image() {
  log BUILD "frontend -> ${FRONTEND_IMAGE}"
  if [ ! -f "${REPO_ROOT}/Dockerfile" ]; then
    log BUILD "ERROR: no existe ${REPO_ROOT}/Dockerfile"
    return 1
  fi
  (
    cd "${REPO_ROOT}" &&
      docker build \
        --build-arg "VITE_API_URL=${VITE_API_URL}" \
        -t "${FRONTEND_IMAGE}" \
        .
  )
}

scan_image() {
  local tag="$1" output="$2" name="$3"
  log TRIVY "Analizando ${name} (${tag})"
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v trivy-cache:/root/.cache/trivy \
    -v "${REPORTS_DIR}:/reports" \
    -v "${CONFIG_DIR}:/config:ro" \
    "${TRIVY_IMAGE}" image \
    --config /config/trivy.yaml \
    --scanners vuln,secret \
    --format json \
    --output "/reports/${output}" \
    "${tag}"
}

log INFO "Frontend commit ${FRONTEND_SHA}"

IMAGE_BUILT=0
if build_image; then
  IMAGE_BUILT=1
  scan_image "${FRONTEND_IMAGE}" "trivy-frontend-image.json" "frontend" || STATUS=1
else
  log BUILD "El frontend no se pudo construir: el escaneo queda NOT_EXECUTED"
  STATUS=1
fi

# -----------------------------------------------------------------------------
# SBOM de las imágenes finales, no sólo del código fuente: incluye los paquetes
# del sistema operativo base, que es donde suelen aparecer los CVEs.
if [ "${IMAGE_BUILT}" -eq 1 ]; then
  log SBOM "Generando SBOM de la imagen del frontend"
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v trivy-cache:/root/.cache/trivy \
    -v "${REPORTS_DIR}:/reports" \
    "${TRIVY_IMAGE}" image \
    --format cyclonedx \
    --output /reports/sbom-frontend-image.cyclonedx.json \
    "${FRONTEND_IMAGE}" || STATUS=1
fi

# Deja constancia de qué se analizó exactamente.
cat > "${REPORTS_DIR}/container-scan-metadata.json" <<EOF
{
  "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "frontend": { "image": "${FRONTEND_IMAGE}", "commit": "${FRONTEND_SHA}" }
}
EOF

log INFO "Informes en security/reports/"
exit "${STATUS}"
