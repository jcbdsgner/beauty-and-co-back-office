"use client";

import { useMemo, useState, type ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ChevronLeft, ChevronRight, Copy, Plus, RotateCcw } from "lucide-react";
import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { IconButton } from "@/components/ui/atoms/icon-button";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { Toast } from "@/components/ui/molecules/toast";
import { useLocation } from "@/context/LocationContext";
import { usePlanningData } from "@/context/PlanningContext";
import { cn } from "@/lib/utils";
import { isClosed, salons, type SalonId, type SalonScope } from "@/lib/mock/beautyandco";
import {
  ABSENCE_LABELS,
  PLANNING_DEFAULT_MONDAY,
  TODAY_ISO,
  addDays,
  baseHoursOf,
  dayPlan,
  mondayOf,
  presentPractitioners,
  type Absence,
  type DayPlan,
} from "@/lib/mock/planning";
import { allRendezvous, autoAssign } from "@/lib/mock/rendezvous";
import { initials, members, memberCategoryLabel, type Member, type StaffCategory } from "@/lib/mock/staff";
import { dateOf, planningRows, salonLabel, type PlanningRow } from "../planning-board/data";
import { AbsenceDialog } from "./AbsenceDialog";
import { ShiftForm } from "./ShiftForm";
import {
  applyDay,
  copyPreviousWeek,
  hoursLabel,
  minutesBetween,
  resetWeek,
  restoreDay,
  weekChanges,
  type DayTarget,
  type ScheduleState,
} from "./schedule";

/**
 * Équipe › Planning › **Horaires** (2026-09-28) — le programme de chaque membre de l'équipe,
 * semaine par semaine, et l'endroit où on le change.
 *
 * 1. La propriétaire arrive pour construire ou corriger une semaine : décaler une arrivée,
 *    envoyer quelqu'un à l'autre salon, poser un repos, un congé. Session posée, souris.
 * 2. Ce qui saute aux yeux : qui travaille quel jour, où, de quelle heure à quelle heure — et
 *    ce qui s'écarte de l'habituel (point de marque sur la case). Une case = un clic = son
 *    horaire à changer (arrivée, départ, salon), sur place, sans quitter la grille.
 * 3. Quand ça coince : salon fermé ce jour-là (colonne grisée, choix refusé dans le
 *    formulaire), un salon ouvert sans praticienne (pied de colonne en rouge), des
 *    rendez-vous déjà affectés qui sortent du nouveau créneau (dit dans le formulaire, puis
 *    réaffectés d'office), chaque changement annulable depuis le message de confirmation.
 *
 * Tout s'écrit dans `PlanningContext` : l'agenda de `/rendez-vous`, l'affectation automatique
 * et la prise de rendez-vous lisent les mêmes horaires.
 */

const GROUPS: { key: StaffCategory; label: string }[] = [
  { key: "coiffure", label: "Coiffure" },
  { key: "esthetique", label: "Esthétique" },
  { key: "staff", label: "Accueil, gestion & entretien" },
];

const SALON_OPTIONS = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as string, label: s.name })),
];

const HATCH =
  "repeating-linear-gradient(135deg, transparent 0 7px, color-mix(in oklab, var(--color-base-content) 6%, transparent) 7px 8px)";

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", o).format(dateOf(iso)).replace(".", "");

function weekLabel(monday: string) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(0, 7) === sunday.slice(0, 7);
  const left = sameMonth ? fmt(monday, { day: "numeric" }) : fmt(monday, { day: "numeric", month: "short" });
  return `${left} – ${fmt(sunday, { day: "numeric", month: "short", year: "numeric" })}`;
}

type Props = {
  /** Bascule Horaires / Rendez-vous, posée à gauche de la barre d'outils. */
  modeSwitch?: ReactNode;
};

export default function ScheduleEditor({ modeSwitch }: Props) {
  const { scope, setScope } = useLocation();
  const { absences, setAbsences, overrides, setOverrides, baseHours, setBaseHours, data } = usePlanningData();

  const [monday, setMonday] = useState(PLANNING_DEFAULT_MONDAY);
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; undo: ScheduleState } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const salonId: SalonId | null = scope === "all" ? null : scope;
  const scopeIds: SalonId[] = salonId ? [salonId] : salons.map((s) => s.id);

  // Rendez-vous tels qu'affectés d'office avec les horaires en vigueur.
  const rows: PlanningRow[] = useMemo(() => planningRows(autoAssign(allRendezvous(), data)), [data]);

  const state: ScheduleState = { absences, overrides, baseHours };
  const commit = (next: ScheduleState, message: string) => {
    setToast({ message, undo: state });
    setAbsences(next.absences);
    setOverrides(next.overrides);
    setBaseHours(next.baseHours);
  };
  const undo = () => {
    if (!toast) return;
    setAbsences(toast.undo.absences);
    setOverrides(toast.undo.overrides);
    setBaseHours(toast.undo.baseHours);
  };

  // Toute l'équipe active. Un salon regardé retient celles qui y travaillent cette semaine
  // ou d'habitude — pas un rattachement fixe, une personne peut tourner entre les salons.
  const team = useMemo(() => members.filter((m) => m.active), []);
  const visible = useMemo(
    () =>
      team.filter((m) => {
        if (!salonId) return true;
        if (Object.values(baseHoursOf(m, data)).some((d) => !d.off && d.salonId === salonId)) return true;
        return days.some((iso) => {
          const p = dayPlan(m.id, iso, data).presence;
          return p.state === "present" && p.salonId === salonId;
        });
      }),
    [team, salonId, data, days],
  );

  const plans = useMemo(() => {
    const map = new Map<string, DayPlan>();
    for (const m of visible) for (const iso of days) map.set(`${m.id}|${iso}`, dayPlan(m.id, iso, data));
    return map;
  }, [visible, days, data]);

  const changes = weekChanges(state, monday, new Set(visible.map((m) => m.id)));
  const isCurrentWeek = monday === PLANNING_DEFAULT_MONDAY;
  const closedDay = (iso: string) => scopeIds.every((id) => isClosed(id, iso));

  const save = (m: Member, iso: string, target: DayTarget, everyWeek: boolean) => {
    const day = fmt(iso, { weekday: "long", day: "numeric" });
    const message =
      target.kind === "absent"
        ? `${m.firstName} : ${ABSENCE_LABELS[target.type].toLowerCase()} le ${day}`
        : everyWeek
          ? `Horaire habituel du ${fmt(iso, { weekday: "long" })} mis à jour pour ${m.firstName}`
          : target.kind === "off"
            ? `${m.firstName} : repos le ${day}`
            : `${m.firstName} : ${target.start}–${target.end} à ${salonLabel(target.salonId)} le ${day}`;
    commit(applyDay(state, m, iso, target, everyWeek), message);
    setOpenCell(null);
  };

  const summary =
    changes.adjusted === 0 && changes.absentDays === 0
      ? "Cette semaine suit les horaires habituels."
      : [
          changes.adjusted > 0 && `${changes.adjusted} ${changes.adjusted > 1 ? "horaires modifiés" : "horaire modifié"}`,
          changes.absentDays > 0 && `${changes.absentDays} ${changes.absentDays > 1 ? "jours d'absence" : "jour d'absence"}`,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {modeSwitch ?? <span />}
        <SegmentedToggle
          size="sm"
          value={scope}
          onChange={(v) => setScope(v as SalonScope)}
          options={SALON_OPTIONS}
          aria-label="Filtrer par salon"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <IconButton aria-label="Semaine précédente" onClick={() => setMonday(addDays(monday, -7))} className="size-10 rounded-full hover:bg-base-200">
              <ChevronLeft className="size-5" />
            </IconButton>
            <h2 className="min-w-[13.5rem] text-center text-[19px] font-semibold tabular-nums text-base-content">{weekLabel(monday)}</h2>
            <IconButton aria-label="Semaine suivante" onClick={() => setMonday(addDays(monday, 7))} className="size-10 rounded-full hover:bg-base-200">
              <ChevronRight className="size-5" />
            </IconButton>
          </div>
          {!isCurrentWeek && (
            <Button variant="outline" size="sm" onClick={() => setMonday(mondayOf(TODAY_ISO))}>
              Cette semaine
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Copy className="size-4" />}
            onClick={() => commit(copyPreviousWeek(state, visible, monday), "Semaine précédente recopiée")}
          >
            Copier la semaine précédente
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="size-4" />}
            disabled={changes.adjusted === 0}
            onClick={() => commit(resetWeek(state, monday), "Horaires habituels rétablis pour la semaine")}
          >
            Rétablir l&apos;habituel
          </Button>
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setAbsenceOpen(true)}>
            Ajouter une absence
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">
            Horaires de l&apos;équipe, semaine du {weekLabel(monday)}. {summary}
          </caption>
          <colgroup>
            <col className="w-[232px]" />
            {days.map((iso) => (
              <col key={iso} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-base-300 bg-base-200">
              <th scope="col" className="px-4 py-3 text-left align-bottom text-sm font-medium text-base-content/60">
                {summary}
              </th>
              {days.map((iso) => {
                const today = iso === TODAY_ISO;
                const closed = closedDay(iso);
                return (
                  <th key={iso} scope="col" className={cn("px-1 py-2.5 text-center font-normal", today && "bg-primary/[0.06]")}>
                    <span className={cn("block text-sm font-semibold capitalize", today ? "text-primary" : "text-base-content")}>
                      {fmt(iso, { weekday: "long" })}
                    </span>
                    <span className={cn("block text-[13px] tabular-nums", today ? "font-medium text-primary" : "text-base-content/55")}>
                      {today ? "Aujourd'hui" : closed ? "Fermé" : fmt(iso, { day: "numeric", month: "short" })}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {GROUPS.map((g) => {
            const people = visible.filter((m) => m.category === g.key);
            if (people.length === 0) return null;
            return (
              <tbody key={g.key}>
                <tr>
                  <th
                    colSpan={8}
                    scope="colgroup"
                    className="border-b border-base-300 bg-accent/60 px-4 py-2 text-left text-sm font-semibold text-secondary"
                  >
                    {g.label} <span className="font-normal text-secondary/70">· {people.length}</span>
                  </th>
                </tr>
                {people.map((m) => {
                  let workedDays = 0;
                  let workedMin = 0;
                  for (const iso of days) {
                    const p = plans.get(`${m.id}|${iso}`)!.presence;
                    if (p.state === "present") {
                      workedDays += 1;
                      workedMin += minutesBetween(p.start, p.end);
                    }
                  }
                  return (
                    <tr key={m.id} className="border-b border-base-300 last:border-b-0">
                      <th scope="row" className="px-4 py-2 text-left font-normal">
                        <span className="flex items-center gap-3">
                          <Avatar
                            photoUrl={m.photo}
                            initial={initials(m)}
                            size={36}
                            className="bg-accent text-sm font-semibold text-secondary"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-semibold text-base-content">
                              {`${m.firstName} ${m.lastName}`.trim()}
                            </span>
                            <span className="block truncate text-[13px] text-base-content/55">
                              {memberCategoryLabel(m)} ·{" "}
                              {workedDays === 0 ? "aucun jour" : `${workedDays} j · ${hoursLabel(workedMin)}`}
                            </span>
                          </span>
                        </span>
                      </th>
                      {days.map((iso) => {
                        const key = `${m.id}|${iso}`;
                        return (
                          <td key={iso} className={cn("p-1.5", iso === TODAY_ISO && "bg-primary/[0.04]")}>
                            {closedDay(iso) ? (
                              <div aria-label="Salon fermé" className="h-[58px] rounded-field bg-base-200/80" />
                            ) : (
                              <PopoverPrimitive.Root open={openCell === key} onOpenChange={(o) => setOpenCell(o ? key : null)}>
                                <PopoverPrimitive.Trigger asChild>
                                  <DayCell member={m} iso={iso} plan={plans.get(key)!} salonId={salonId} rows={rows} />
                                </PopoverPrimitive.Trigger>
                                <PopoverPrimitive.Portal>
                                  <PopoverPrimitive.Content
                                    side="bottom"
                                    align="center"
                                    sideOffset={6}
                                    collisionPadding={16}
                                    className="z-50 rounded-box border border-base-300 bg-base-100 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.22)] focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                                  >
                                    <ShiftForm
                                      member={m}
                                      iso={iso}
                                      plan={plans.get(key)!}
                                      rows={rows}
                                      preferredSalon={salonId}
                                      onSave={(target, everyWeek) => save(m, iso, target, everyWeek)}
                                      onRestore={() => {
                                        commit(restoreDay(state, m.id, iso), `${m.firstName} : horaire habituel rétabli le ${fmt(iso, { weekday: "long", day: "numeric" })}`);
                                        setOpenCell(null);
                                      }}
                                      onCancel={() => setOpenCell(null)}
                                    />
                                  </PopoverPrimitive.Content>
                                </PopoverPrimitive.Portal>
                              </PopoverPrimitive.Root>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            );
          })}

          <tfoot>
            <tr className="border-t border-base-300 bg-base-200">
              <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-base-content/60">
                Praticiennes sur place
              </th>
              {days.map((iso) => (
                <td key={iso} className="px-1 py-2.5 text-center align-top">
                  {closedDay(iso) ? (
                    <span className="text-sm text-base-content/40">—</span>
                  ) : (
                    scopeIds.map((id) => {
                      if (isClosed(id, iso)) {
                        return (
                          <span key={id} className="block text-[13px] text-base-content/40">
                            {salonLabel(id)} fermé
                          </span>
                        );
                      }
                      const n = presentPractitioners(id, iso, data).length;
                      return (
                        <span
                          key={id}
                          className={cn("block text-[13px] tabular-nums", n === 0 ? "font-semibold text-error" : "text-base-content/70")}
                        >
                          {salonId ? "" : `${salonLabel(id)} `}
                          {n === 0 ? (salonId ? "Personne" : "0") : n}
                        </span>
                      );
                    })
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-base-content/60">
        <p>Cliquez sur une case pour changer l&apos;arrivée, le départ ou le salon de ce jour.</p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-3.5 w-5 rounded-[4px] border border-primary/20 bg-accent" />
            Horaire habituel
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            Modifié pour ce jour
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="h-3.5 w-5 rounded-[4px] border border-warning/30 bg-warning/10" />
            Absence
          </li>
          {salonId && (
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3.5 w-5 rounded-[4px] border border-base-300" style={{ backgroundImage: HATCH }} />
              Dans l&apos;autre salon
            </li>
          )}
        </ul>
      </div>

      {absenceOpen && (
        <AbsenceDialog
          team={team}
          defaultFrom={days.includes(TODAY_ISO) ? TODAY_ISO : monday}
          rows={rows}
          onClose={() => setAbsenceOpen(false)}
          onSubmit={(a: Absence) => {
            const who = team.find((m) => m.id === a.memberId)?.firstName ?? "";
            commit({ ...state, absences: [...absences, a] }, `Absence de ${who} enregistrée`);
            setAbsenceOpen(false);
          }}
        />
      )}

      <Toast message={toast?.message ?? null} onDismiss={() => setToast(null)} action={toast ? { label: "Annuler", onClick: undo } : undefined} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Case d'un jour                                                      */
/* ------------------------------------------------------------------ */

type CellProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  member: Member;
  iso: string;
  plan: DayPlan;
  salonId: SalonId | null;
  rows: PlanningRow[];
};

// Bouton déclencheur du popover (reçoit les props de `PopoverPrimitive.Trigger asChild`).
function DayCell({ member, iso, plan, salonId, rows, className, ...trigger }: CellProps) {
  const p = plan.presence;
  const modified = plan.source === "ajuste";
  const dayName = fmt(iso, { weekday: "long", day: "numeric", month: "long" });
  const base = cn(
    "relative flex h-[58px] w-full flex-col items-center justify-center rounded-field px-1.5 text-center transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=open]:ring-2 data-[state=open]:ring-primary",
    className,
  );
  const dot = modified && <span aria-hidden className="mr-1 inline-block size-2 shrink-0 rounded-full bg-primary" />;

  if (p.state === "absent") {
    const reason = plan.absence?.reason;
    return (
      <button
        type="button"
        {...trigger}
        aria-label={`${member.firstName}, ${dayName} : ${ABSENCE_LABELS[p.type].toLowerCase()}. Modifier`}
        className={cn(base, "border border-warning/30 bg-warning/10 hover:bg-warning/15")}
      >
        <span className="text-sm font-semibold text-base-content/80">{ABSENCE_LABELS[p.type]}</span>
        {reason && <span className="w-full truncate text-xs text-base-content/60">{reason}</span>}
      </button>
    );
  }

  if (p.state === "off") {
    const closedHere = plan.closedSalon;
    return (
      <button
        type="button"
        {...trigger}
        aria-label={`${member.firstName}, ${dayName} : repos. Planifier`}
        className={cn(base, "group border border-dashed border-base-300 hover:border-primary/40 hover:bg-accent/50")}
      >
        {closedHere ? (
          <span className="text-xs text-base-content/45 group-hover:hidden group-focus-visible:hidden">{salonLabel(closedHere)} fermé</span>
        ) : modified ? (
          <span className="flex items-center text-xs font-medium text-base-content/60 group-hover:hidden group-focus-visible:hidden">
            {dot}
            Repos
          </span>
        ) : null}
        <span className="hidden items-center gap-1 text-xs font-semibold text-secondary group-hover:flex group-focus-visible:flex">
          <Plus aria-hidden className="size-3.5" />
          Planifier
        </span>
      </button>
    );
  }

  const elsewhere = salonId !== null && p.salonId !== salonId;
  const count = rows.filter(
    (r) => r.dateIso === iso && r.salonId === p.salonId && (r.staffId === member.id || r.secondStaffId === member.id),
  ).length;

  return (
    <button
      type="button"
      {...trigger}
      aria-label={`${member.firstName}, ${dayName} : ${p.start} à ${p.end}, ${salonLabel(p.salonId)}${modified ? ", horaire modifié" : ""}. Modifier`}
      className={cn(
        base,
        elsewhere
          ? "border border-base-300 bg-base-100 hover:bg-base-200"
          : "border border-primary/20 bg-accent hover:border-primary/40 hover:bg-[color-mix(in_oklab,var(--color-accent)_80%,var(--color-primary)_8%)]",
      )}
      style={elsewhere ? { backgroundImage: HATCH } : undefined}
    >
      <span className={cn("text-sm font-semibold tabular-nums", elsewhere ? "text-base-content/55" : "text-secondary")}>
        {p.start}–{p.end}
      </span>
      {/* Tous les salons : le salon du jour ; un salon regardé : l'autre salon, sinon les rdv du jour. */}
      {(dot || elsewhere || !salonId || count > 0) && (
        <span className={cn("flex max-w-full items-center justify-center text-xs", elsewhere ? "text-base-content/50" : "text-secondary/75")}>
          {dot}
          <span className="truncate">{elsewhere || !salonId ? salonLabel(p.salonId) : count > 0 ? `${count} rdv` : "Modifié"}</span>
        </span>
      )}
    </button>
  );
}
