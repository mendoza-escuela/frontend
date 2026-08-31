# Pipeline de seguridad del frontend

Validación reproducible del código y de la imagen desplegable del frontend. Las
herramientas corren en contenedores con versiones fijadas en
`security/config/tool-versions.env`; el único requisito operativo es Docker.

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
| `create-summary.sh` | Consolida resultados y artefactos obligatorios | Python |
| `validate-exceptions.py` | Rechaza excepciones vencidas o mal formadas | Python |

`run-dast.sh`, `wait-for-app.sh` y sus configuraciones se conservan
temporalmente como archivos legacy, pero no están soportados ni son invocados
por `run-all.sh`, el wrapper de Windows o los workflows. El DAST operativo se
ejecuta únicamente desde backend.

## Herramientas y versiones

| Herramienta | Versión | Rol |
| --- | --- | --- |
| Semgrep | 1.145.0 | SAST y 3 reglas propias del frontend |
| Trivy | 0.74.0 | Dependencias, imagen, SBOM y misconfig |
| OSV-Scanner | v2.2.4 | Segunda fuente sobre los lockfiles |
| Gitleaks | v8.30.0 | Secretos en el historial completo |

Nunca se usa `latest`. Para actualizar una herramienta se cambia una sola vez
`security/config/tool-versions.env`; los scripts locales y CI consumen esa misma
fuente.

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
