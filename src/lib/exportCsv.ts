/**
 * Generates a CSV string from an array of objects and triggers a browser download.
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns: { key: string; label: string }[],
) {
  if (data.length === 0) return;

  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = row[c.key];
        const str = value == null ? '' : String(value);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(','),
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
