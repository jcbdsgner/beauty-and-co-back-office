"use client";

import { dashboardKpis, salons, satisfaction, type SalonScope } from "@/lib/mock/beautyandco";
import type { TodayVisit } from "@/components/back-office/dashboard/today";

// « Repères » : les chiffres de la journée, en une seule bande découpée par
// des filets (plus quatre cartes de même poids). Le nombre de rendez-vous
// vient des vrais rendez-vous du jour ; les pourcentages de variation ne sont
// gardés que pour l'argent — sur « 2 contre 3 », un « −33 % » en rouge
// n'était que du bruit alarmant.

type Figure = { label: string; value: string; unit?: string; foot: string };

export default function TodayKpiCards({
  scope,
  visits,
}: {
  scope: SalonScope;
  visits: TodayVisit[];
}) {
  const kpis = Object.fromEntries(dashboardKpis(scope, "today").map((k) => [k.key, k]));
  const booked = visits.filter((v) => !v.closed);
  const sat = satisfaction(scope, "90");

  const bySalon = salons
    .map((s) => ({ name: s.name, n: booked.filter((v) => v.rdv.salon === s.id).length }))
    .filter((s) => s.n > 0);

  const figures: Figure[] = [
    {
      label: "Rendez-vous",
      value: String(booked.length),
      foot:
        scope === "all" && bySalon.length > 1
          ? bySalon.map((s) => `${s.n} ${s.name}`).join(" · ")
          : "réservés aujourd'hui",
    },
    {
      label: "Chiffre d'affaires",
      value: kpis.ca?.value ?? "—",
      unit: kpis.ca?.unit,
      foot:
        typeof kpis.ca?.delta === "number"
          ? `${kpis.ca.direction === "down" ? "−" : "+"}${Math.abs(kpis.ca.delta)} % par rapport à hier`
          : "aujourd'hui",
    },
    {
      label: "Nouvelles clientes",
      value: kpis.clients?.value ?? "—",
      // `hint` = « 3 nouveaux clients hier » : on n'en garde que le nombre.
      foot: kpis.clients?.hint ? `${kpis.clients.hint.split(" ")[0]} la veille` : "",
    },
    {
      label: "Satisfaction",
      value: sat.count > 0 ? (kpis.satisfaction?.value ?? "—") : "—",
      unit: sat.count > 0 ? "/5" : undefined,
      foot: sat.count > 0 ? `${sat.count} avis sur 90 jours` : "Pas encore d'avis",
    },
  ];

  return (
    <section aria-label="Chiffres du jour">
      <dl className="grid grid-cols-4 divide-x divide-base-300 rounded-box border border-base-300 bg-base-100">
        {figures.map((f) => (
          <div key={f.label} className="px-6 py-5">
            <dt className="text-sm text-base-content/60">{f.label}</dt>
            <dd className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] leading-none font-semibold tracking-[-0.02em] tabular-nums text-base-content">
                {f.value}
              </span>
              {f.unit && <span className="text-sm font-medium text-base-content/60">{f.unit}</span>}
            </dd>
            <dd className="mt-2 text-sm text-base-content/60">{f.foot}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
