import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  getValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectedId?: number | string;
  rowKey: (row: T) => number | string;
  exportFilename?: string;
}

function exportCSV<T>(sorted: T[], columns: Column<T>[], filename: string) {
  const exportCols = columns.filter((c) => c.key !== 'actions' && c.header !== '');
  const header = exportCols.map((c) => `"${c.header}"`).join(',');
  const rows = sorted.map((row) =>
    exportCols.map((col) => {
      const raw = col.getValue ? col.getValue(row) : (row as any)[col.key] ?? '';
      return `"${String(raw).replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');
  const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable<T>({
  data,
  columns,
  pageSize = 15,
  onRowClick,
  selectedId,
  rowKey,
  exportFilename,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    return [...data].sort((a, b) => {
      const av = col?.getValue ? col.getValue(a) : ((a as any)[sortKey] ?? '');
      const bv = col?.getValue ? col.getValue(b) : ((b as any)[sortKey] ?? '');
      const cmp =
        typeof av === 'number'
          ? av - (bv as number)
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  style={{ cursor: col.sortable === false ? 'default' : 'pointer' }}
                >
                  {col.header}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr
                key={rowKey(row)}
                className={selectedId !== undefined && rowKey(row) === selectedId ? 'tr-selected' : ''}
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? 'pointer' : undefined }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-state-icon">◉</div>
                    <div className="empty-state-text">No records found</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">
          {data.length} record{data.length !== 1 ? 's' : ''}, page {safePage} of {totalPages}
        </span>
        <div className="pagination-btns">
          {exportFilename && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportCSV(sorted, columns, exportFilename)}
              title="Export all rows as CSV"
            >
              ↓ Export CSV
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹ Prev
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
