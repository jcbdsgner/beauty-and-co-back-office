"use client";

import { DownloadIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import type { GeneratedReport } from "@/lib/mock/beautyandco";

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Export CSV (séparateur « ; » + BOM, pour Excel FR) construit depuis le rapport
// affiché — aucun backend. Impression via le navigateur.
function downloadCsv(report: GeneratedReport) {
  const table: (string | number)[][] = [
    [report.groupHeader, ...report.metrics.map((m) => m.label)],
    ...report.rows.map((r) => [
      r.label,
      ...report.metrics.map((m) => r.cells[m.id]?.raw ?? ""),
    ]),
    ["Total", ...report.metrics.map((m) => report.totals[m.id]?.raw ?? "")],
  ];

  const csv = table
    .map((row) =>
      row
        .map((value) => {
          const cell = String(value).replace(/"/g, '""');
          return /[";\n]/.test(cell) ? `"${cell}"` : cell;
        })
        .join(";"),
    )
    .join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rapport-${slug(report.groupHeader)}-${slug(report.periodLabel)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportActions({ report }: { report: GeneratedReport }) {
  const disabled = !report.hasRows;

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="primary"
        disabled={disabled}
        startIcon={<DownloadIcon className="size-4" />}
        onClick={() => downloadCsv(report)}
      >
        Télécharger (CSV)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => window.print()}
      >
        Imprimer
      </Button>
    </div>
  );
}
