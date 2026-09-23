"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import PageHeader from "@/components/back-office/PageHeader";
import RatingStars from "@/components/ui/rating/RatingStars";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { useLocation } from "@/context/LocationContext";
import {
  frShortDate,
  salons,
  satisfaction,
  type SalonScope,
  type SatisfactionWindow,
} from "@/lib/mock/beautyandco";

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const WINDOW_OPTIONS: SegmentedOption<SatisfactionWindow>[] = [
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
];

const fr1 = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const cardClass =
  "flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 md:p-6";

/* --------------------------------------------------------------- cartes hero */

function AverageCard({
  avg,
  trend,
  trendLabel,
  count,
}: {
  avg: number;
  trend: number | null;
  trendLabel: string;
  count: number;
}) {
  const up = trend != null && trend > 0;
  const down = trend != null && trend < 0;

  return (
    <div className={cardClass}>
      <span className="text-theme-sm text-gray-500">Note moyenne</span>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-title-sm font-bold leading-none text-gray-800">{fr1(avg)}</span>
          <span className="text-lg font-semibold text-gray-400">/ 5</span>
        </div>
        <RatingStars value={avg} size="md" />
      </div>
      <div className="mt-3 flex min-h-[1.5rem] items-center gap-2 text-theme-xs">
        {trend != null && trend !== 0 ? (
          <>
            <span
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                up ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"
              }`}
            >
              {up && <ArrowUpIcon />}
              {down && <ArrowDownIcon />}
              {fr1(Math.abs(trend))} pt
            </span>
            <span className="text-gray-400">{trendLabel}</span>
          </>
        ) : (
          <span className="text-gray-400">
            {trend === 0 ? `Stable ${trendLabel}` : "Pas de comparaison disponible"}
          </span>
        )}
      </div>
      <div className="mt-auto pt-3 text-theme-xs text-gray-400">Sur {count} avis</div>
    </div>
  );
}

function CountCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "neutral" | "alert";
}) {
  const alert = tone === "alert" && value > 0;
  return (
    <div className={cardClass}>
      <span className="text-theme-sm text-gray-500">{label}</span>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={`text-title-sm font-bold leading-none ${
            alert ? "text-error-600" : "text-gray-800"
          }`}
        >
          {value}
        </span>
      </div>
      <div className="mt-auto pt-3 text-theme-xs text-gray-400">{hint}</div>
    </div>
  );
}

/* -------------------------------------------------- répartition + par équipe */

function DistributionCard({
  distribution,
  count,
  windowLabel,
}: {
  distribution: { stars: number; count: number }[];
  count: number;
  windowLabel: string;
}) {
  const max = Math.max(1, ...distribution.map((d) => d.count));
  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">Répartition des notes</h3>
      <p className="mt-1 text-theme-sm text-gray-500">
        {count} avis · {windowLabel}
      </p>
      <div className="mt-6 space-y-4">
        {distribution.map((d) => {
          const share = count ? Math.round((d.count / count) * 100) : 0;
          return (
            <div key={d.stars} className="flex items-center gap-3">
              <span className="flex w-14 shrink-0 items-center gap-1 text-theme-sm font-medium text-gray-600">
                {d.stars}
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-warning-400" fill="currentColor">
                  <path d="M10 1.6l2.47 5.005 5.525.803-3.998 3.897.944 5.502L10 14.612l-4.941 2.597.944-5.502-3.998-3.897 5.525-.803z" />
                </svg>
              </span>
              <div className="h-2 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-warning-400"
                  style={{ width: `${Math.round((d.count / max) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-theme-sm text-gray-500">
                {d.count}
                <span className="ml-1 text-gray-400">({share} %)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function barColor(avg: number) {
  if (avg < 3) return "bg-error-400";
  if (avg < 4) return "bg-warning-400";
  return "bg-brand-500";
}

function ByStaffCard({
  byStaff,
}: {
  byStaff: {
    name: string;
    salon: string;
    avg: number;
    count: number;
    lowSample: boolean;
  }[];
}) {
  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">Note par collaboratrice</h3>
      <p className="mt-1 text-theme-sm text-gray-500">
        Classées par note · seuls comptent les avis de la période
      </p>
      <div className="mt-6 space-y-5">
        {byStaff.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between text-theme-sm">
              <span className="font-medium text-gray-700">
                {s.name}
                <span className="ml-2 text-theme-xs font-normal text-gray-400">{s.salon}</span>
              </span>
              <span className="text-gray-500">
                {fr1(s.avg)} / 5
                <span className="ml-1 text-gray-400">
                  · {s.count} avis{s.lowSample ? " · peu d'avis" : ""}
                </span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${s.lowSample ? "bg-gray-300" : barColor(s.avg)}`}
                style={{ width: `${Math.round((s.avg / 5) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- commentaires */

function CommentsCard({
  comments,
}: {
  comments: {
    id: string;
    rating: number;
    client: string;
    service: string;
    staff: string;
    date: string;
    comment?: string;
  }[];
}) {
  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-theme-sm text-gray-500">
        Aucun commentaire écrit sur la période — uniquement des notes.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {comments.map((c) => (
        <div
          key={c.id}
          className={`p-5 md:p-6 ${c.rating <= 2 ? "border-l-2 border-error-300" : ""}`}
        >
          <div className="flex items-center gap-2">
            <RatingStars value={c.rating} size="sm" />
            <span className="text-theme-xs font-medium text-gray-500">{c.rating}/5</span>
          </div>
          <p className="mt-2 text-theme-sm text-gray-700">« {c.comment} »</p>
          <p className="mt-2 text-theme-xs text-gray-400">
            {c.client} · {c.service} · {c.staff} · {frShortDate(c.date)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- écran */

const RELIABILITY_NOTE: Record<string, string | null> = {
  ok: null,
  limited: "Échantillon limité — la moyenne reste indicative.",
  insufficient: "Trop peu d'avis : la moyenne n'est pas significative, lisez plutôt les commentaires.",
  none: null,
};

export default function Satisfaction() {
  const { scope, setScope } = useLocation();
  const [window, setWindow] = useState<SatisfactionWindow>("90");
  const data = satisfaction(scope, window);

  const mostRecentUnhappy = data.unhappy[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Satisfaction client"
        actions={
          <>
            <div className="flex items-center gap-2">
              <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Salon
              </span>
              <SegmentedControl
                options={SALON_OPTIONS}
                value={scope}
                onChange={setScope}
                aria-label="Filtrer par salon"
                variant="tinted"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-theme-xs font-medium uppercase tracking-wide text-gray-400">
                Période
              </span>
              <SegmentedControl
                options={WINDOW_OPTIONS}
                value={window}
                onChange={setWindow}
                aria-label="Période affichée"
              />
            </div>
          </>
        }
      />

      {data.count === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-800">Aucun avis sur cette période</h3>
          <p className="mt-1 max-w-xl text-theme-sm text-gray-500">
            Les avis sont collectés automatiquement après chaque visite terminée. Élargissez la
            période ou revenez plus tard.
          </p>
        </div>
      ) : (
        <>
          {data.unhappy.length > 0 && mostRecentUnhappy && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">À traiter</h2>
              <Alert
                variant="warning"
                title={`${data.unhappy.length} ${
                  data.unhappy.length > 1 ? "clientes ont" : "cliente a"
                } mis 2/5 ou moins sur la période`}
                message={`La plus récente : ${mostRecentUnhappy.client} · ${
                  mostRecentUnhappy.staff
                } · ${frShortDate(mostRecentUnhappy.date)}${
                  mostRecentUnhappy.comment ? ` — « ${mostRecentUnhappy.comment} »` : ""
                }`}
                showLink
                linkHref="#commentaires"
                linkText="Voir les commentaires"
              />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">{data.windowLabel}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
              <AverageCard
                avg={data.avg as number}
                trend={data.trend}
                trendLabel={data.trendLabel}
                count={data.count}
              />
              <CountCard
                label="Avis reçus"
                value={data.count}
                hint={`dont ${data.comments.length} avec un commentaire`}
              />
              <CountCard
                label="Clientes mécontentes"
                value={data.unhappy.length}
                hint={
                  data.unhappy.length > 0
                    ? "note de 2/5 ou moins · à recontacter"
                    : "note de 2/5 ou moins"
                }
                tone="alert"
              />
            </div>
            {RELIABILITY_NOTE[data.reliability] && (
              <p className="text-theme-xs text-gray-400">{RELIABILITY_NOTE[data.reliability]}</p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
            <DistributionCard
              distribution={data.distribution}
              count={data.count}
              windowLabel={data.windowLabel}
            />
            <ByStaffCard byStaff={data.byStaff} />
          </div>

          <section id="commentaires" className="scroll-mt-24 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Derniers commentaires</h2>
            <CommentsCard comments={data.comments} />
          </section>
        </>
      )}

      <p className="max-w-2xl text-theme-xs text-gray-400">
        Les avis sont collectés automatiquement après chaque visite terminée. Les clientes très
        satisfaites sont invitées à publier leur avis sur Google.
      </p>
    </div>
  );
}
