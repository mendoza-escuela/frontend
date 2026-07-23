import { AlertTriangle, ArrowLeft, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { getHttpErrorMessage } from '../../lib/http-error';
import { showError, showSuccess } from '../../lib/toast';
import { adminUsersService } from '../../services/admin-users.service';
import type { ImportPreview, ImportResult } from '../../types/admin-user';

export function BulkUserImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const previewFile = async () => {
    if (!file) return showError('Seleccioná un archivo CSV o XLSX.');
    setLoading(true); setResult(null);
    try { setPreview(await adminUsersService.preview(file)); }
    catch (error) { showError(getHttpErrorMessage(error)); setPreview(null); }
    finally { setLoading(false); }
  };

  const importRows = async () => {
    if (!file || !preview?.validCount) return;
    setLoading(true);
    try {
      const importResult = await adminUsersService.import(file);
      setResult(importResult);
      showSuccess(`${importResult.importedCount} usuarios importados correctamente.`);
      setPreview(null);
    } catch (error) { showError(getHttpErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return <main className="p-4 sm:p-8"><div className="mx-auto max-w-6xl"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-mendoza-blue" to="/admin/usuarios"><ArrowLeft size={17} />Volver a usuarios</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">Carga masiva</p><h1 className="mt-1 text-3xl font-bold text-mendoza-text">Importar usuarios</h1><p className="mt-2 text-mendoza-muted">Admite CSV o XLSX, hasta 500 filas y 2 MB.</p></div><Button icon={<Download size={17} />} onClick={() => void adminUsersService.downloadTemplate()} variant="outline">Descargar plantilla</Button></div>
    <section className="mt-6 rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm"><label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-mendoza-sky bg-mendoza-sky/5 p-8 text-center"><FileSpreadsheet className="text-mendoza-blue" size={38} /><span className="mt-3 font-semibold text-mendoza-text">{file?.name ?? 'Seleccionar archivo'}</span><span className="mt-1 text-sm text-mendoza-muted">CSV o Excel XLSX</span><input accept=".csv,.xlsx" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setResult(null); }} type="file" /></label><div className="mt-4 flex justify-end"><Button disabled={!file || loading} icon={<Upload size={17} />} onClick={() => void previewFile()}>{loading ? 'Validando…' : 'Validar y previsualizar'}</Button></div></section>
    {preview && <section className="mt-6"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Filas" value={preview.totalRows} /><Metric label="Válidas" value={preview.validCount} positive /><Metric label="Con errores" value={preview.errorCount} warning /></div>{preview.errorCount > 0 && <div className="mt-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="shrink-0" size={20} /><p>La importación será parcial: se crearán únicamente las filas válidas. Las filas con errores quedarán excluidas.</p></div>}<PreviewTable preview={preview} /><div className="mt-4 flex justify-end"><Button disabled={!preview.validCount || loading} onClick={() => void importRows()}>{loading ? 'Importando…' : `Importar ${preview.validCount} filas válidas`}</Button></div></section>}
    {result && <section className="mt-6 rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-mendoza-blue">Resultado de importación</h2><p className="mt-2 text-mendoza-text">Se importaron {result.importedCount} de {result.totalRows} filas. {result.errorCount} filas no fueron importadas.</p>{result.errors.length > 0 && <ul className="mt-4 space-y-2 text-sm text-mendoza-error">{result.errors.map((error) => <li key={`${error.line}-${error.email}`}>Fila {error.line} ({error.email || 'sin correo'}): {error.errors.join(' ')}</li>)}</ul>}</section>}
  </div></main>;
}

function Metric({ label, value, positive, warning }: { label: string; value: number; positive?: boolean; warning?: boolean }) { return <div className="rounded-xl border border-mendoza-border bg-white p-4"><p className="text-sm text-mendoza-muted">{label}</p><p className={`mt-1 text-2xl font-bold ${warning ? 'text-amber-700' : positive ? 'text-green-700' : 'text-mendoza-blue'}`}>{value}</p></div>; }

function PreviewTable({ preview }: { preview: ImportPreview }) { return <div className="mt-4 overflow-x-auto rounded-xl border border-mendoza-border bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-mendoza-blue text-white"><tr>{['Fila', 'Nombre', 'Correo', 'Rol', 'Colegio', 'Validación'].map((header) => <th className="px-3 py-3" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-mendoza-border">{preview.rows.map((row) => <tr className={row.errors.length ? 'bg-red-50' : ''} key={row.line}><td className="px-3 py-3">{row.line}</td><td className="px-3 py-3">{row.lastName}, {row.firstName}</td><td className="px-3 py-3">{row.email || '—'}</td><td className="px-3 py-3">{row.role === 'admin' ? 'Administrador' : row.role === 'school' ? 'Colegio' : '—'}</td><td className="px-3 py-3">{row.schoolCode ?? '—'}</td><td className={`px-3 py-3 ${row.errors.length ? 'text-mendoza-error' : 'font-semibold text-green-700'}`}>{row.errors.length ? row.errors.join(' ') : 'Fila válida'}</td></tr>)}</tbody></table></div>; }
