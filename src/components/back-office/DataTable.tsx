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

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Aucune donnée",
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100">
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  isHeader
                  className={`px-5 py-3 font-medium text-gray-500 text-theme-xs ${
                    col.align === "right" ? "text-end" : "text-start"
                  }`}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-8 text-center text-gray-500 text-theme-sm">
                  {empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={rowKey(row)} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`px-5 py-4 text-gray-700 text-theme-sm ${
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
