#!/usr/bin/env bash
# =============================================================================
# Ejecuta la suite de seguridad propia del frontend y produce el veredicto final.
#
#   1. Validación de excepciones (una vencida rompe el pipeline)
#   2. Análisis estático: Semgrep, Gitleaks, Trivy FS, OSV, SBOM
#   3. Build + escaneo de la imagen frontend
#   4. Resumen consolidado y política de gates
#
# Uso:
#   ./security/scripts/run-all.sh
#   ./security/scripts/run-all.sh --static-only   alias compatible del comando anterior
#
# El stack efímero, los tests integrados y el DAST pertenecen al repositorio
# backend, que puede levantar la aplicación completa. Este script no los invoca.
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Expone PYTHON_IMAGE para el fallback que corre dentro de `bash -c`.
# shellcheck source=load-tool-versions.sh
. "${SCRIPT_DIR}/load-tool-versions.sh" || exit $?

for arg in "$@"; do
  case "${arg}" in
    --static-only)
      printf 'AVISO: --static-only se conserva por compatibilidad; la suite frontend ya incluye únicamente análisis estático y su imagen.\n'
      ;;
    --full-dast | --keep-env)
      printf 'La opción %s no está soportada en frontend; ejecutá el DAST/stack desde el repositorio backend.\n' "${arg}" >&2
      exit 2
      ;;
    *) printf 'Opción desconocida: %s\n' "${arg}" >&2; exit 2 ;;
  esac
done

declare -A STAGE_STATUS=()
STAGE_ORDER=()

stage() {
  local name="$1"
  shift
  STAGE_ORDER+=("${name}")
  printf '\n\033[1;34m======== %s ========\033[0m\n' "${name}"
  if "$@"; then
    STAGE_STATUS["${name}"]="OK"
  else
    STAGE_STATUS["${name}"]="FALLO"
  fi
}

cd "${REPO_ROOT}"

# --- 1. Excepciones ----------------------------------------------------------
stage "Excepciones de seguridad" bash -c '
  case "$(uname -s)" in
    MINGW* | MSYS* | CYGWIN*) export MSYS_NO_PATHCONV=1 ;;
  esac
  if python3 -c "import sys" >/dev/null 2>&1; then
    python3 security/scripts/validate-exceptions.py
  else
    docker run --rm -v "$(pwd)":/src -w /src "${PYTHON_IMAGE}" \
      python security/scripts/validate-exceptions.py
  fi'

# --- 2. Estático -------------------------------------------------------------
stage "Análisis estático" bash "${SCRIPT_DIR}/run-static.sh"

# --- 3. Imagen frontend ------------------------------------------------------
stage "Build y escaneo de imagen frontend" bash "${SCRIPT_DIR}/run-container-scan.sh"

# --- 4. Resumen --------------------------------------------------------------
printf '\n\033[1;34m======== Resumen y política de gates ========\033[0m\n'
bash "${SCRIPT_DIR}/create-summary.sh"
GATE_RESULT=$?

printf '\n=== Etapas ===\n'
PIPELINE_OK=0
for name in "${STAGE_ORDER[@]}"; do
  printf '  %-32s %s\n' "${name}" "${STAGE_STATUS[$name]}"
  [ "${STAGE_STATUS[$name]}" = "FALLO" ] && PIPELINE_OK=1
done

printf '\nInforme completo: security/reports/summary.md\n'

if [ "${GATE_RESULT}" -ne 0 ]; then
  printf '\n\033[1;31mRESULTADO: FAIL — la política de seguridad bloquea este cambio.\033[0m\n'
  exit 1
fi
if [ "${PIPELINE_OK}" -ne 0 ]; then
  printf '\n\033[1;31mRESULTADO: FAIL — alguna etapa no pudo completarse.\033[0m\n'
  exit 1
fi
printf '\n\033[1;32mRESULTADO: la política de seguridad no bloquea este cambio.\033[0m\n'
printf 'Revisá las advertencias del resumen antes de dar el cambio por cerrado.\n'
