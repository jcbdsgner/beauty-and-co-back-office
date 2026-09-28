import type { GeneratedReport } from "@/lib/mock/beautyandco";

// Tableau généré : première colonne = l'axe choisi, une colonne par indicateur,
// ligne « Total » en pied. Aucune interaction — c'est le document à sortir.
export default function ReportTable({ report }: { report: GeneratedReport }) {
  if (report.metrics.length === 0) {
    return (
      <div className="rounded-box border border-dashed border-base-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-base-content/80">
          Aucun indicateur sélectionné
        </p>
        <p className="mt-1 text-sm text-base-content/60">
          Cochez au moins une colonne dans le panneau de gauche pour composer le rapport.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {report.droppedMetrics.length > 0 && (
        <p className="text-xs text-base-content/60">
          {report.droppedMetrics.map((m) => m.label).join(", ")}{" "}
          {report.droppedMetrics.length > 1 ? "ne s'appliquent pas" : "ne s'applique pas"} à un
          regroupement par {report.groupHeader.toLowerCase()} — colonne
          {report.droppedMetrics.length > 1 ? "s masquées" : " masquée"}.
        </p>
      )}

      <div className="overflow-x-auto rounded-box border border-base-300 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-base-300 text-xs text-base-content/60">
              <th className="px-5 py-3 text-start font-medium">{report.groupHeader}</th>
              {report.metrics.map((m) => (
                <th key={m.id} className="px-5 py-3 text-end font-medium whitespace-nowrap">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-base-300">
            {report.rows.map((row) => (
              <tr key={row.key}>
                <td className="px-5 py-3.5 font-medium text-base-content">{row.label}</td>
                {report.metrics.map((m) => (
                  <td key={m.id} className="px-5 py-3.5 text-end tabular-nums text-base-content/80">
                    {row.cells[m.id]?.display ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-base-300 font-semibold text-base-content">
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

      <p className="text-xs text-base-content/45">
        {report.rows.length} ligne{report.rows.length > 1 ? "s" : ""} · {report.periodLabel} ·{" "}
        {report.scopeLabel}
      </p>
    </div>
  );
}
