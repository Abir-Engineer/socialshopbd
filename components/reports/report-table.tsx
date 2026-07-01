"use client";

import { useState } from "react";

type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
};

type ReportTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
};

export function ReportTable<T extends { [key: string]: any }>({ columns, data, emptyMessage = "No data" }: ReportTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...data];
  const col = columns.find((c) => c.key === sortKey);
  if (col && col.sortable && col.sortValue) {
    sorted.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`pb-3 font-medium ${col.sortable ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                {col.label}
                {sortKey === col.key && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={row.id ?? i} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 text-card-foreground">{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
