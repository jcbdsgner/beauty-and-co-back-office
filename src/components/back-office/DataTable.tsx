import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right";
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
};

// Habillage du `DataTable` de point-de-vente (2026-09-27) : en-têtes en capitales
// espacées, lignes 15px, survol `accent`. Garde un vrai <table> (poste souris).
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Aucune donnée",
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-box border border-border bg-white">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-base-300">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`px-4 py-3 text-xs font-semibold tracking-wide text-base-content/55 uppercase ${
                    col.align === "right" ? "text-end" : "text-start"
                  }`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-base-200">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-12 text-center text-sm text-base-content/45">
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)} className="transition hover:bg-accent/40">
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`px-4 py-3.5 text-[15px] text-base-content/90 ${
                        col.align === "right" ? "text-end" : "text-start"
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
