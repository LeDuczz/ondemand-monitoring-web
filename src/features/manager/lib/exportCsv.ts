/**
 * Triggers a browser file download for a CSV document built from `headers`
 * and `rows`. No external library — pure DOM approach. [BRIEF MNG-12].
 *
 * @param headers - Array of column header strings (first row).
 * @param rows    - Array of data rows; each row is an array of cell strings.
 * @param filename - Optional base filename (without .csv extension);
 *   defaults to `"bao-cao"`.
 */
export function exportCsv(
  headers: string[],
  rows: string[][],
  filename = 'bao-cao',
): void {
  const BOM = '﻿' // UTF-8 BOM for Excel compatibility
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers, ...rows]
    .map((row) => row.map(escape).join(','))
    .join('\r\n')
  const csvContent = BOM + lines

  const a = document.createElement('a')
  a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
