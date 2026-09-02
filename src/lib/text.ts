/**
 * Normaliza texto libre para búsquedas tolerantes a mayúsculas y diacríticos.
 */
export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

/**
 * Divide una etiqueta extensa en líneas aptas para ejes de gráficos.
 */
export function wrapChartLabel(label: string, maximumLength: number) {
  const lines: string[] = [];
  for (const word of label.split(/\s+/)) {
    const currentLine = lines.at(-1);
    if (
      !currentLine ||
      `${currentLine} ${word}`.length > maximumLength
    ) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    }
  }
  return lines;
}
