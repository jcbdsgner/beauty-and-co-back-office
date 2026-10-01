"use client";

import { useId, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Select } from "@/components/ui/atoms/select";
import { TextInput } from "@/components/ui/atoms/text-input";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { cn } from "@/lib/utils";
import { salons, type SalonId } from "@/lib/mock/beautyandco";
import { ABSENCE_LABELS, type AbsenceType, type DayPlan } from "@/lib/mock/planning";
import type { Member } from "@/lib/mock/staff";
import { dateOf, formatHour, salonLabel, type PlanningRow } from "../planning-board/data";
import { hoursLabel, minutesBetween, openingOf, rdvOutside, timeSteps, type DayTarget } from "./schedule";

// Contenu du popover d'une case du planning : la décision d'un membre pour un
// jour — travaille (salon, début, fin), repos, ou absente (motif). Case à
// cocher « chaque <jour> » pour en faire l'horaire habituel.
//
// Cas dégradés : salon fermé ce jour-là (choix refusé, dit pourquoi), fin
// avant le début (impossible : les listes se bornent l'une l'autre),
// rendez-vous déjà affectés qui sortiraient du créneau (dit lesquels et ce
// qu'il adviendra d'eux), plage d'absence de plusieurs jours (dit que seul ce
// jour change).

type Status = "work" | "off" | "absent";

// Libellés accordés au genre du membre (« Absent » pour Henry).
const statusOptions = (m: Member) => [
  { value: "work", label: "Travaille" },
  { value: "off", label: "Repos" },
  { value: "absent", label: m.gender === "m" ? "Absent" : "Absente" },
];

const ABSENCE_OPTIONS = (["conge", "maladie", "formation"] as AbsenceType[]).map((value) => ({
  value,
  label: ABSENCE_LABELS[value],
}));

const longDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(dateOf(iso));
const weekdayName = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(dateOf(iso));
const shortDay = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(dateOf(iso)).replace(".", "");

type Props = {
  member: Member;
  iso: string;
  plan: DayPlan;
  rows: PlanningRow[];
  /** Salon regardé (filtre global) — salon proposé quand le membre ne travaillait pas. */
  preferredSalon: SalonId | null;
  onSave: (target: DayTarget, everyWeek: boolean) => void;
  onRestore: () => void;
  onCancel: () => void;
};

export function ShiftForm({ member, iso, plan, rows, preferredSalon, onSave, onRestore, onCancel }: Props) {
  const titleId = useId();
  const p = plan.presence;
  const h = plan.habitual;

  // Point de départ : ce qui s'applique aujourd'hui dans la case, sinon l'habituel, sinon
  // le salon regardé / le premier salon ouvert, sur toute l'amplitude d'ouverture.
  const openSalons = salons.map((s) => s.id).filter((id) => openingOf(id, iso));
  const fallbackSalon: SalonId =
    (preferredSalon && openSalons.includes(preferredSalon) ? preferredSalon : openSalons[0]) ?? "almadies";
  const fallbackHours = openingOf(fallbackSalon, iso) ?? { open: "10:00", close: "20:00" };
  const seed: { salonId: SalonId; start: string; end: string } =
    p.state === "present"
      ? { salonId: p.salonId, start: p.start, end: p.end }
      : !h.off
        ? { salonId: h.salonId, start: h.start, end: h.end }
        : { salonId: fallbackSalon, start: fallbackHours.open, end: fallbackHours.close };

  const [status, setStatus] = useState<Status>(p.state === "present" ? "work" : p.state === "absent" ? "absent" : "off");
  const [salonId, setSalonId] = useState<SalonId>(seed.salonId);
  const [start, setStart] = useState(seed.start);
  const [end, setEnd] = useState(seed.end);
  const [absenceType, setAbsenceType] = useState<AbsenceType>(
    plan.absence && plan.absence.type !== "repos" ? plan.absence.type : "conge",
  );
  const [reason, setReason] = useState(plan.absence?.reason ?? "");
  const [everyWeek, setEveryWeek] = useState(false);

  const opening = openingOf(salonId, iso);
  const steps = opening ? timeSteps(opening.open, opening.close) : [];
  const startOptions = steps.slice(0, -1).filter((t) => t < end || !steps.includes(end));
  const endOptions = steps.slice(1).filter((t) => t > start);

  const changeSalon = (id: SalonId) => {
    setSalonId(id);
    const o = openingOf(id, iso);
    if (!o) return;
    // Ramène le créneau dans les heures du nouveau salon.
    const s = start < o.open || start >= o.close ? o.open : start;
    const e = end > o.close || end <= s ? o.close : end;
    setStart(s);
    setEnd(e);
  };

  const target: DayTarget =
    status === "work"
      ? { kind: "work", salonId, start, end }
      : status === "off"
        ? { kind: "off" }
        : { kind: "absent", type: absenceType, reason };

  const error =
    status === "work" && !opening
      ? `${salonLabel(salonId)} est fermé le ${weekdayName(iso)}.`
      : status === "work" && start >= end
        ? "L'heure de fin doit suivre l'heure de début."
        : null;

  const outside = rdvOutside(rows, member.id, iso, target);
  const multiDay = plan.absence && plan.absence.from !== plan.absence.to;
  const habitualText = h.off ? "repos" : `${salonLabel(h.salonId)}, ${formatHour(h.start)}–${formatHour(h.end)}`;

  return (
    <form
      aria-labelledby={titleId}
      className="flex w-[360px] flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!error) onSave(target, status !== "absent" && everyWeek);
      }}
    >
      <div className="px-5 pt-5">
        <h3 id={titleId} className="text-[17px] font-semibold text-base-content">
          {member.firstName} <span className="font-normal text-base-content/60">· {longDay(iso)}</span>
        </h3>
        <p className="mt-0.5 text-sm text-base-content/60">
          Habituellement le {weekdayName(iso)} : {habitualText}
          {plan.source !== "habituel" && (
            <>
              {" · "}
              <button
                type="button"
                onClick={onRestore}
                className="inline-flex items-center gap-1 font-medium text-secondary underline decoration-secondary/30 underline-offset-4 hover:decoration-secondary"
              >
                <RotateCcw aria-hidden className="size-3.5" />
                y revenir
              </button>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5 pt-4 pb-5">
        <SegmentedToggle size="sm" value={status} onChange={(v) => setStatus(v as Status)} options={statusOptions(member)} aria-label="Ce jour-là" />

        {status === "work" && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-base-content/70">Salon</span>
              <div role="radiogroup" aria-label="Salon" className="grid grid-cols-2 gap-2">
                {salons.map((s) => {
                  const active = s.id === salonId;
                  const closed = !openingOf(s.id, iso);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => changeSalon(s.id)}
                      className={cn(
                        "flex h-11 flex-col items-center justify-center rounded-field border text-sm font-semibold transition active:scale-[0.98]",
                        active
                          ? "border-primary bg-accent text-secondary"
                          : "border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200",
                      )}
                    >
                      {s.name}
                      {closed && <span className="text-[11px] font-medium text-base-content/45">fermé ce jour</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {opening && (
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-base-content/70">Arrivée</span>
                  <Select size="compact" value={start} onChange={setStart} options={startOptions.map((t) => ({ value: t, label: t }))} aria-label="Heure d'arrivée" />
                </label>
                <span aria-hidden className="pb-3 text-base-content/40">→</span>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-base-content/70">Départ</span>
                  <Select size="compact" value={end} onChange={setEnd} options={endOptions.map((t) => ({ value: t, label: t }))} aria-label="Heure de départ" />
                </label>
              </div>
            )}
            {opening && !error && (
              <p className="-mt-2 text-sm text-base-content/60">
                {hoursLabel(minutesBetween(start, end))} de présence · ouvert {formatHour(opening.open)}–{formatHour(opening.close)}
              </p>
            )}
          </>
        )}

        {status === "absent" && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-base-content/70">Motif</span>
              <Select size="compact" value={absenceType} onChange={(v) => setAbsenceType(v as AbsenceType)} options={ABSENCE_OPTIONS} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-base-content/70">Précision (facultatif)</span>
              <TextInput size="compact" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. formation pose gel" />
            </label>
            {multiDay && plan.absence && (
              <p className="text-sm text-base-content/60">
                Absence du {shortDay(plan.absence.from)} au {shortDay(plan.absence.to)} : le motif change pour toute la période.
              </p>
            )}
          </>
        )}

        {status !== "absent" && multiDay && plan.absence && (
          <p className="text-sm text-base-content/60">
            {member.firstName} est {member.gender === "m" ? "absent" : "absente"} du {shortDay(plan.absence.from)} au {shortDay(plan.absence.to)} : seul le {weekdayName(iso)}{" "}
            {shortDay(iso)} sortira de l&apos;absence.
          </p>
        )}

        {status !== "absent" && (
          <label className="flex cursor-pointer items-start gap-2.5 text-[15px] text-base-content/80">
            <input
              type="checkbox"
              checked={everyWeek}
              onChange={(e) => setEveryWeek(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm mt-0.5"
            />
            <span>
              Tous les {weekdayName(iso)}s
              <span className="block text-sm text-base-content/55">
                {everyWeek ? "Devient son horaire habituel, semaine après semaine." : `Sinon, seulement le ${shortDay(iso)}.`}
              </span>
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-error">
            {error}
          </p>
        )}

        {!error && outside.length > 0 && (
          <div className="flex gap-2.5 rounded-field bg-warning/10 px-3 py-2.5 text-sm text-base-content/80">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            <p>
              {outside.length === 1
                ? `1 rendez-vous de ${member.firstName} ce jour-là (${outside[0].start}) sortirait de ce créneau : il sera confié à une autre praticienne disponible, sinon signalé à régler.`
                : `${outside.length} rendez-vous de ${member.firstName} ce jour-là (${outside.map((r) => r.start).join(", ")}) sortiraient de ce créneau : ils seront confiés à une autre praticienne disponible, sinon signalés à régler.`}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-base-300 px-5 py-3.5">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button size="sm" type="submit" disabled={Boolean(error)}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
