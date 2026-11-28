const normalize = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

export function filterAndPaginate(rows, searchTerm = '', page = 1, pageSize = 25, getSearchText = row => Object.values(row).join(' ')) {
  const source = Array.isArray(rows) ? rows : [];
  const needle = normalize(searchTerm);
  const filteredRows = needle
    ? source.filter(row => normalize(getSearchText(row)).includes(needle))
    : source;
  const safePageSize = Math.min(200, Math.max(1, Math.floor(Number(pageSize) || 25)));
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / safePageSize));
  const currentPage = Math.min(pageCount, Math.max(1, Math.floor(Number(page) || 1)));
  const start = (currentPage - 1) * safePageSize;
  const pageRows = filteredRows.slice(start, start + safePageSize);

  return {
    filteredRows,
    pageRows,
    page: currentPage,
    pageSize: safePageSize,
    pageCount,
    total: filteredRows.length,
    startIndex: filteredRows.length ? start + 1 : 0,
    endIndex: Math.min(start + safePageSize, filteredRows.length),
  };
}
