import type { GeneratedReport } from "@/lib/mock/beautyandco";

// Tableau généré : première colonne = l'axe choisi, une colonne par indicateur,
// ligne « Total » en pied. Aucune interaction — c'est le document à sortir.
export default function ReportTable({ report }: { report: GeneratedReport }) {
  if (report.metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-theme-sm font-medium text-gray-700">
          Aucun indicateur sélectionné
        </p>
        <p className="mt-1 text-theme-sm text-gray-500">
          Cochez au moins une colonne dans le panneau de gauche pour composer le rapport.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.droppedMetrics.length > 0 && (
        <p className="text-theme-xs text-gray-500">
          {report.droppedMetrics.map((m) => m.label).join(", ")}{" "}
          {report.droppedMetrics.length > 1 ? "ne s'appliquent pas" : "ne s'applique pas"} à un
          regroupement par {report.groupHeader.toLowerCase()} — colonne
          {report.droppedMetrics.length > 1 ? "s masquées" : " masquée"}.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-theme-sm">
          <thead>
            <tr className="border-b border-gray-100 text-theme-xs text-gray-500">
              <th className="px-5 py-3 text-start font-medium">{report.groupHeader}</th>
              {report.metrics.map((m) => (
                <th key={m.id} className="px-5 py-3 text-end font-medium whitespace-nowrap">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.rows.map((row) => (
              <tr key={row.key}>
                <td className="px-5 py-3.5 font-medium text-gray-800">{row.label}</td>
                {report.metrics.map((m) => (
                  <td key={m.id} className="px-5 py-3.5 text-end tabular-nums text-gray-700">
                    {row.cells[m.id]?.display ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-semibold text-gray-800">
              <td className="px-5 py-3.5">Total</td>
              {report.metrics.map((m) => (
                <td key={m.id} className="px-5 py-3.5 text-end tabular-nums">
                  {report.totals[m.id]?.display ?? "—"}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-theme-xs text-gray-400">
        {report.rows.length} ligne{report.rows.length > 1 ? "s" : ""} · {report.periodLabel} ·{" "}
        {report.scopeLabel}
      </p>
    </div>
  );
}
