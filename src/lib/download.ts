export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Obtiene un nombre seguro desde Content-Disposition y conserva un fallback
 * conocido por la pantalla cuando el proxy no expone ese encabezado.
 */
export function downloadFilename(
  contentDisposition: string | null | undefined,
  fallback: string,
) {
  const safeFallback = cleanDownloadFilename(fallback) ?? "descarga";
  if (!contentDisposition) return safeFallback;
  const encoded = contentDisposition.match(
    /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i,
  )?.[1];
  const basic = contentDisposition.match(
    /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i,
  );
  const rawFilename = encoded ?? basic?.[1] ?? basic?.[2];
  if (!rawFilename) return safeFallback;
  let decodedFilename = rawFilename.trim().replace(/^"|"$/g, "");
  try {
    decodedFilename = decodeURIComponent(decodedFilename);
  } catch {
    decodedFilename = rawFilename.trim().replace(/^"|"$/g, "");
  }
  return cleanDownloadFilename(decodedFilename) ?? safeFallback;
}

function cleanDownloadFilename(filename: string) {
  const withoutControlCharacters = [...filename]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");
  const safeFilename = withoutControlCharacters
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/^[.\s-]+/, "")
    .trim();
  return safeFilename && safeFilename !== "." && safeFilename !== ".."
    ? safeFilename
    : null;
}
