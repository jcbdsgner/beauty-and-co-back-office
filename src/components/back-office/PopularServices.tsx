"use client";

import { groupThousands, popularServices, type SalonScope } from "@/lib/mock/beautyandco";

// Prestations les plus demandées sur 30 jours glissants (suit le filtre
// salon). Repère de fond, posé en bas de l'accueil : il ne change pas d'une
// heure à l'autre et n'appelle aucun geste immédiat.
export default function PopularServices({ scope }: { scope: SalonScope }) {
  const { items } = popularServices(scope);
  const max = Math.max(...items.map((s) => s.count));

  return (
    <section
      aria-labelledby="popular-title"
      className="rounded-box border border-base-300 bg-base-100 px-6 pt-5 pb-6"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h2 id="popular-title" className="text-[20px] font-semibold text-base-content">
          Prestations les plus demandées
        </h2>
        <span className="text-sm text-base-content/60">30 derniers jours</span>
      </header>

      <ol className="mt-4 space-y-3.5">
        {items.map((service) => (
          <li key={service.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5">
            <span className="truncate text-[15px] text-base-content">{service.name}</span>
            <span className="text-sm tabular-nums text-base-content/60">
              {groupThousands(service.count)} réservations · {service.share}&nbsp;%
            </span>
            <span aria-hidden className="col-span-2 h-1.5 overflow-hidden rounded-full bg-base-200">
              <span
                className="block h-full rounded-full bg-brand-500"
                style={{ width: `${(service.count / max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
