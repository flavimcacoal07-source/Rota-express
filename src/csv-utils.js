const FORMULA_PREFIX = /^[\\u0000-\\u0020]*[=+\\-@]/;

function escapeCsvCell(value) {
  const text = String(value ?? '');
  const safe = typeof value === 'string' && FORMULA_PREFIX.test(text)
    ? `'${text}`
    : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildCsv(headers, rows, valuesForRow = row => row) {
  const lines = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map(row => valuesForRow(row).map(escapeCsvCell).join(';')),
  ];

  return `\\uFEFF${lines.join('\\r\\n')}\\r\\n`;
}
