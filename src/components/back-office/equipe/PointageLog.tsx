"use client";

import Link from "next/link";
import { salonName, type SalonScope } from "@/lib/mock/beautyandco";
import { journalDayLabel } from "@/lib/mock/journal";
import { ABSENCE_LABELS, TODAY_ISO } from "@/lib/mock/planning";
import {
  earlyLeaveMinutes,
  hasAnomaly,
  hoursLabel,
  lateMinutes,
  missingPunch,
  presenceMinutes,
  summarize,
  teamPointagesByDay,
  type TeamPointage,
} from "@/lib/mock/pointage";
import {
  ROLE_LABELS,
  initials,
  memberById,
  memberCategoryLabel,
  type Member,
} from "@/lib/mock/staff";
import { Avatar } from "@/components/back-office/equipe/ui";
import {
  ArrivalValue,
  DepartureValue,
  PointageSummaryBar,
} from "@/components/back-office/shared/PointageCells";

// Équipe › Pointage — à quelle heure chaque personne est arrivée et repartie,
// jour par jour, en regard de l'horaire prévu par le planning.
//
// 1. La propriétaire vérifie de loin (« tout le monde est-il arrivé à l'heure
//    ce matin ? ») ou enquête sur une personne (« combien de retards cette
//    semaine ? »). Lecture seule : le badgeage se fait sur le poste de caisse.
// 2. Ce qui saute aux yeux : les écarts — retard, départ anticipé, badge
//    oublié — dans un registre où tout ce qui est à l'heure reste discret.
//    Une personne choisie → son bilan de la période en tête.
// 3. Cas dégradés : journée en cours (« En poste »), arrivée ou départ non
//    badgé (signalé, jamais inventé), absence, rien sur la période, aucun écart.

// Décompte d'une liste de journées : qui a travaillé, et chaque type d'écart.
// Sert à l'en-tête de chaque jour et au bilan de la période (vue équipe).
export type PointageTally = {
  rows: number;
  worked: number;
  late: number;
  early: number;
  missing: number;
  absent: number;
};

export function tallyPointages(rows: TeamPointage[]): PointageTally {
  const t: PointageTally = { rows: rows.length, worked: 0, late: 0, early: 0, missing: 0, absent: 0 };
  for (const { day } of rows) {
    if (day.kind === "absent") {
      t.absent++;
      continue;
    }
    t.worked++;
    if (lateMinutes(day) > 0) t.late++;
    if (earlyLeaveMinutes(day) > 0) t.early++;
    if (missingPunch(day)) t.missing++;
  }
  return t;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

// Les écarts d'un décompte, en morceaux de phrase (« 1 retard », « 6 départs
// anticipés »…) ; vide si tout est à l'heure.
export function anomalyParts(t: PointageTally): string[] {
  return [
    t.late > 0 && plural(t.late, "retard", "retards"),
    t.early > 0 && plural(t.early, "départ anticipé", "départs anticipés"),
    t.missing > 0 && plural(t.missing, "badge oublié", "badges oubliés"),
    t.absent > 0 && plural(t.absent, "absence", "absences"),
  ].filter((p): p is string => Boolean(p));
}

export function pointageRows(
  range: { from: string; to: string },
  scope: SalonScope,
  memberId: string | null,
  onlyAnomalies: boolean,
) {
  return teamPointagesByDay(range, scope, memberId)
    .flatMap((g) => g.rows)
    .filter((r) => !onlyAnomalies || hasAnomaly(r.day));
}

export default function PointageLog({
  range,
  scope,
  memberId,
  onlyAnomalies,
  onShowAll,
  onWiden,
}: {
  range: { from: string; to: string };
  scope: SalonScope;
  memberId: string | null;
  onlyAnomalies: boolean;
  onShowAll: () => void;
  onWiden: () => void;
}) {
  const groups = teamPointagesByDay(range, scope, memberId);
  const all = groups.flatMap((g) => g.rows);
  const shown = groups
    .map((g) => ({ ...g, rows: onlyAnomalies ? g.rows.filter((r) => hasAnomaly(r.day)) : g.rows }))
    .filter((g) => g.rows.length > 0);
  const member = memberId ? memberById(memberId) : null;
  const showSalon = scope === "all";

  return (
    <div className="space-y-6">
      {member && all.length > 0 && (
        <div className="space-y-3">
          <PointageSummaryBar summary={summarize(all.map((r) => r.day))} />
        </div>
      )}

      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-box border border-base-300 bg-white px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-base-content">
            {all.length === 0
              ? member
                ? `Aucune journée prévue pour ${member.firstName} sur cette période`
                : "Aucune journée prévue sur cette période"
              : "Aucun écart sur cette période : arrivées et départs à l'heure"}
          </h3>
          <button
            type="button"
            onClick={all.length === 0 ? onWiden : onShowAll}
            className="mt-3 text-sm font-medium text-secondary hover:underline"
          >
            {all.length === 0 ? "Élargir aux 30 derniers jours" : "Afficher toutes les journées"}
          </button>
        </div>
      ) : member ? (
        <Table lead="day" showSalon={showSalon} rows={shown.flatMap((g) => g.rows)} />
      ) : (
        <div className="space-y-8">
          {shown.map((g) => (
            <DayGroup key={g.date} date={g.date} rows={g.rows} showSalon={showSalon} />
          ))}
        </div>
      )}

      <p className="text-sm text-base-content/60">
        Heures badgées sur le poste de caisse du salon. Un retard est compté au-delà de 5 minutes
        après l&apos;heure prévue, un départ anticipé au-delà de 10 minutes avant.
      </p>
    </div>
  );
}

// Le motif sans redire le type (« Formation pose gel » sous « Formation »
// reste lisible ; seule une répétition mot pour mot du type est retirée).
const absenceDetail = (type: keyof typeof ABSENCE_LABELS, reason?: string) => {
  const r = reason?.trim();
  if (!r || r.toLowerCase() === ABSENCE_LABELS[type].toLowerCase()) return null;
  return r;
};

const WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// Métier pour une praticienne, rôle pour le reste de l'équipe (« Caisse »,
// « Manager », « Ménage » plutôt que la catégorie technique `staff`).
const personRole = (m: Member) =>
  m.category === "staff" ? ROLE_LABELS[m.roles[0]] : memberCategoryLabel(m);

function DayGroup({
  date,
  rows,
  showSalon,
}: {
  date: string;
  rows: TeamPointage[];
  showSalon: boolean;
}) {
  const label = journalDayLabel(date);
  const tally = tallyPointages(rows);
  const anomalies = anomalyParts({ ...tally, absent: 0 });
  return (
    <section aria-labelledby={`pt-${date}`}>
      <h2
        id={`pt-${date}`}
        className="mb-2.5 flex items-baseline gap-2 pl-1 text-[17px] font-semibold text-base-content"
      >
        {label.charAt(0).toUpperCase() + label.slice(1)}
        <span className="text-sm font-normal text-base-content/60">
          {plural(tally.worked, "personne au travail", "personnes au travail")}
          {tally.absent > 0 && ` · ${plural(tally.absent, "absence", "absences")}`}
          {anomalies.length > 0 && (
            <span className="text-warning-700"> · {anomalies.join(" · ")}</span>
          )}
        </span>
      </h2>
      <Table lead="person" showSalon={showSalon} rows={rows} />
    </section>
  );
}

// Un tableau à colonnes fixes : d'un jour à l'autre, les heures restent
// alignées. Première colonne = la personne (vue équipe) ou le jour (vue d'une
// seule personne).
function Table({
  lead,
  showSalon,
  rows,
}: {
  lead: "person" | "day";
  showSalon: boolean;
  rows: TeamPointage[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-white">
      <table className="w-full table-fixed text-[15px]">
        <colgroup>
          <col className={lead === "person" ? "w-[25%]" : "w-[22%]"} />
          {showSalon && <col className="w-[13%]" />}
          <col className="w-[15%]" />
          <col className="w-[14%]" />
          <col className="w-[16%]" />
          <col />
        </colgroup>
        <thead>
          <tr className="border-b border-base-300 text-left text-sm text-base-content/60">
            <th className="py-3 pl-5 pr-3 font-medium">{lead === "person" ? "Personne" : "Jour"}</th>
            {showSalon && <th className="px-3 py-3 font-medium">Salon</th>}
            <th className="px-3 py-3 font-medium">Prévu</th>
            <th className="px-3 py-3 font-medium">Arrivée</th>
            <th className="px-3 py-3 font-medium">Départ</th>
            <th className="py-3 pl-3 pr-5 text-right font-medium">Présence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Row key={`${r.member.id}-${r.day.date}`} row={r} lead={lead} showSalon={showSalon} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row: { member, day },
  lead,
  showSalon,
}: {
  row: TeamPointage;
  lead: "person" | "day";
  showSalon: boolean;
}) {
  const d = new Date(`${day.date}T00:00:00`);
  const leadCell =
    lead === "person" ? (
      <td className="py-2.5 pl-5 pr-3">
        <Link
          href={`/equipe?membre=${member.id}`}
          className="group flex items-center gap-3"
          title="Ouvrir la fiche"
        >
          <Avatar initials={initials(member)} photo={member.photo} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-base-content group-hover:underline">
              {member.firstName} {member.lastName}
            </span>
            <span className="block truncate text-sm text-base-content/60">
              {personRole(member)}
            </span>
          </span>
        </Link>
      </td>
    ) : (
      <td className="py-3 pl-5 pr-3 whitespace-nowrap">
        <span className="inline-block w-10 text-base-content/60">{WEEKDAYS[d.getDay()]}</span>
        <span className="font-medium text-base-content">
          {d.getDate()} {MONTHS[d.getMonth()]}
        </span>
        {day.date === TODAY_ISO && (
          <span className="ml-2 text-sm text-secondary">Aujourd&apos;hui</span>
        )}
      </td>
    );

  if (day.kind === "absent") {
    return (
      <tr className="border-t border-base-300 first:border-t-0">
        {leadCell}
        {showSalon && (
          <td className="px-3 py-3 text-base-content/45">
            {day.salonId ? salonName(day.salonId) : "—"}
          </td>
        )}
        <td colSpan={4} className="px-3 py-3 text-base-content/60">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-base-content/70">
            Absence · {ABSENCE_LABELS[day.type].toLowerCase()}
          </span>
          {absenceDetail(day.type, day.reason) && (
            <span className="ml-2.5">{absenceDetail(day.type, day.reason)}</span>
          )}
        </td>
      </tr>
    );
  }

  const presence = presenceMinutes(day);
  return (
    <tr className="border-t border-base-300 first:border-t-0">
      {leadCell}
      {showSalon && <td className="px-3 py-3 text-base-content/70">{salonName(day.salonId)}</td>}
      <td className="px-3 py-3 tabular-nums text-base-content/60">
        {day.plannedStart} – {day.plannedEnd}
      </td>
      <td className="px-3 py-3 tabular-nums">
        <ArrivalValue day={day} />
      </td>
      <td className="px-3 py-3 tabular-nums">
        <DepartureValue day={day} />
      </td>
      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap tabular-nums text-base-content/80">
        {presence === null ? "—" : hoursLabel(presence)}
        {day.ongoing && <span className="ml-1 text-sm text-base-content/60">en cours</span>}
      </td>
    </tr>
  );
}
