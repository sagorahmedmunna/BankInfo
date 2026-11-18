/**
 * Escapes a single cell value according to RFC 4180 CSV rules.
 *
 * @param {unknown} value Cell value to serialize
 * @returns {string}
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a UTF-8 BOM-prefixed CSV string from headers and row arrays.
 *
 * @param {Array<string>} headers Column headers
 * @param {Array<Array<unknown>>} rows Data rows
 * @returns {string}
 */
export function buildCsvContent(headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a browser file download for the generated CSV data using a Blob URL.
 *
 * @param {string} filename Target filename (e.g. "schedule.csv")
 * @param {Array<string>} headers Column headers
 * @param {Array<Array<unknown>>} rows Data rows
 */
export function exportToCsv(filename, headers, rows) {
  const csv = buildCsvContent(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

