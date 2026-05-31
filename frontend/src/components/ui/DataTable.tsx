import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col, index) => (
              <th key={index} className="pb-3 pt-4 px-4 font-medium text-slate-500 text-sm">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="py-4 px-4 text-sm text-slate-800">
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-slate-500">
                No hay datos disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
