# Pipeline de seguridad del frontend

Validación reproducible del código y de la imagen desplegable del frontend. Las
herramientas corren en contenedores con versiones fijadas en
`security/config/tool-versions.env`; el único requisito operativo es Docker.
`security/scripts/load-tool-versions.sh` carga y valida esa fuente antes de cada
ejecución.

El stack efímero, los tests integrados de seguridad y el DAST pertenecen al
pipeline del repositorio backend, porque allí se puede levantar y auditar la
pareja frontend/API completa. Este repositorio no contiene
`compose.security.yml` y no declara cobertura DAST independiente.

## Uso rápido

```bash
./security/scripts/run-all.sh
```

`--static-only` se conserva como alias compatible y ejecuta el mismo alcance:
análisis estático más escaneo de la imagen frontend. Las opciones históricas
`--full-dast` y `--keep-env` ya no están soportadas aquí.

En Windows: `.\security\run-security.ps1`.

El veredicto queda en `security/reports/summary.md`.

## Alcance

| Script | Función | Herramientas |
| --- | --- | --- |
| `run-all.sh` | Orquesta el alcance completo del frontend y aplica el veredicto | todas las siguientes |
| `run-static.sh` | SAST, SCA, secretos y SBOM | Semgrep, Gitleaks, Trivy, OSV |
| `run-container-scan.sh` | Construye y analiza sólo la imagen frontend | Docker, Trivy |
| `load-tool-versions.sh` | Valida y exporta todas las imágenes canónicas | Bash |
| `setup-project-npm.sh` | Instala el npm fijado en `packageManager` para CI | Node.js, npm |
| `create-summary.sh` | Consolida resultados y artefactos obligatorios | Python |
| `validate-exceptions.py` | Rechaza excepciones vencidas o mal formadas | Python |

Este repositorio no conserva wrappers ni configuraciones DAST locales. El DAST
operativo se ejecuta únicamente desde backend, donde existe el stack integrado.

## Herramientas y versiones

| Herramienta | Fuente | Rol |
| --- | --- | --- |
| Python | `PYTHON_IMAGE` | Runtime de respaldo para los consolidadores |
| Semgrep | `SEMGREP_IMAGE` | SAST y reglas propias del frontend |
| Trivy | `TRIVY_IMAGE` | Dependencias, imagen, SBOM y misconfig |
| OSV-Scanner | `OSV_SCANNER_IMAGE` | Segunda fuente sobre los lockfiles |
| Gitleaks | `GITLEAKS_IMAGE` | Secretos en el historial completo |

Nunca se usa `latest`. Para actualizar una herramienta se cambia una sola vez
`security/config/tool-versions.env`; los scripts locales y CI consumen esa misma
fuente. El helper rechaza variables faltantes, adicionales, duplicadas y
referencias sin tag o digest fijo.

Los workflows tampoco repiten la versión de npm: `setup-project-npm.sh` la
deriva de `package.json#packageManager`. Los valores de `uses:` de GitHub Actions
son la única excepción técnica: GitHub no permite variables ni expresiones en
ese campo, por lo que sus SHA permanecen fijados y comentados inline.

Backend y frontend conservan copias vendorizadas de los helpers comunes. Es una
decisión deliberada para que cada repositorio sea autónomo; las pruebas de
integridad validan el inventario y las fuentes locales en cada uno.

## Política de bloqueo

El resultado es **FAIL** ante cualquiera de estas condiciones:

1. Secreto detectado.
2. Hallazgo CRITICAL sin excepción vigente.
3. Hallazgo HIGH nuevo respecto del baseline.
4. Excepción vencida.
5. Informe requerido ausente, vacío o inválido.
6. SBOM o metadato obligatorio ausente o vacío.

MEDIUM/LOW y HIGH ya conocidos producen **PASS WITH WARNINGS**.

`NOT_EXECUTED` nunca equivale a `PASS`. Los jobs parciales de CI declaran su
alcance con `--partial --require-group static|container`; sin grupo explícito,
el consolidador rechaza la ejecución.

## Reglas de trabajo

1. Toda supresión debe citar una excepción `SEC-EXC-` de
   `security/exceptions/security-exceptions.yml`.
2. Las excepciones vencen a los 90 días como máximo.
3. No se descartan errores generales con `|| true` ni `continue-on-error`.
4. `ignore-unfixed: false` mantiene visibles las vulnerabilidades sin parche.
5. Los informes crudos quedan en `security/reports/` y no se versionan.

**“Sin vulnerabilidades detectadas” no significa “aplicación segura”.** La
automatización complementa, pero no reemplaza, la revisión manual y el DAST
integrado del backend.
