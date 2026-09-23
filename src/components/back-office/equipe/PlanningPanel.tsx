"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import SegmentedControl, {
  type SegmentedOption,
} from "@/components/ui/segmented/SegmentedControl";
import { useLocation } from "@/context/LocationContext";
import {
  frLongDate,
  salonName,
  salons,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import {
  PLANNING_DEFAULT_MONDAY,
  addDays,
  coverageGaps,
  weekHasExceptions,
  weekPresence,
  type Absence,
  type PlanningData,
  type ShiftOverride,
} from "@/lib/mock/planning";
import { rdvCountByStaffDay } from "@/lib/mock/rendezvous";
import type { Member } from "@/lib/mock/staff";
import PlanningGrid from "../planning/PlanningGrid";
import AbsenceDialog from "../planning/AbsenceDialog";

// Onglet « Planning » de l'écran Équipe — la présence de l'équipe, pas les
// rendez-vous. Fusionné depuis l'ancienne page /planning (2026-09-14) : c'est
// une vue de l'équipe dans le temps, pas un domaine à part.
//
// 1. Où en est la propriétaire ? Coup d'œil : « qui travaille cette semaine, où,
//    et manque-t-il quelqu'un quelque part ? ». Ou geste rapide : poser un congé,
//    ajuster un horaire. Elle arrive souvent, reste peu.
// 2. Ce qui doit sauter aux yeux : un trou de couverture — un salon ouvert sans
//    aucune praticienne un jour donné. C'est le bandeau rouge en haut et la
//    colonne « Personne ».
// 3. Quand ça se passe mal : semaine future encore vierge → message « suit les
//    horaires habituels » ; salon fermé → colonne grisée « Fermé » ; poser une
//    absence sur des RDV déjà pris → alerte + lien vers les rendez-vous.

const SALON_OPTIONS: SegmentedOption<SalonScope>[] = [
  { value: "all", label: "Tous les salons" },
  ...salons.map((s) => ({ value: s.id as SalonScope, label: s.name })),
];

const inWeek = (iso: string, monday: string) => iso >= monday && iso <= addDays(monday, 6);

type Props = {
  // Levées dans `Equipe` pour survivre à un changement d'onglet (Membres /
  // Planning / Autorisations), comme `autorisations`.
  absences: Absence[];
  setAbsences: Dispatch<SetStateAction<Absence[]>>;
  overrides: ShiftOverride[];
  setOverrides: Dispatch<SetStateAction<ShiftOverride[]>>;
};

export default function PlanningPanel({
  absences,
  setAbsences,
  overrides,
  setOverrides,
}: Props) {
  const { scope, setScope } = useLocation();

  const [monday, setMonday] = useState(PLANNING_DEFAULT_MONDAY);
  const [dialog, setDialog] = useState<{ member: Member; date: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const data: PlanningData = useMemo(
    () => ({ absences, shiftOverrides: overrides }),
    [absences, overrides],
  );

  const gaps = useMemo(() => coverageGaps(scope, monday, data), [scope, monday, data]);
  const gapKeys = useMemo(() => new Set(gaps.map((g) => g.iso)), [gaps]);

  const overrideMembersThisWeek = useMemo(
    () => new Set(overrides.filter((o) => inWeek(o.date, monday)).map((o) => o.memberId)),
    [overrides, monday],
  );

  const weekHasOverrides = overrideMembersThisWeek.size > 0;
  const vierge = !weekHasExceptions(monday, data);

  // Rendez-vous par jour pour la praticienne visée par le dialogue (tous salons).
  const dialogRdvDays = useMemo(() => {
    if (!dialog) return [];
    return rdvCountByStaffDay("all")
      .filter((r) => r.staffFirstName === dialog.member.firstName)
      .map((r) => ({ date: r.date, count: r.count }));
  }, [dialog]);

  const scopedMemberCount = useMemo(
    () => weekPresence(scope, monday, data).rows.length,
    [scope, monday, data],
  );

  const applyUsualHours = () => {
    setOverrides((list) => list.filter((o) => !inWeek(o.date, monday)));
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMonday((m) => addDays(m, -7))}
            aria-label="Semaine précédente"
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            ‹
          </button>
          <span className="min-w-56 text-center text-theme-sm font-medium text-gray-700">
            Semaine du {frLongDate(monday)}
          </span>
          <button
            type="button"
            onClick={() => setMonday((m) => addDays(m, 7))}
            aria-label="Semaine suivante"
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          >
            ›
          </button>
          {monday !== PLANNING_DEFAULT_MONDAY && (
            <button
              type="button"
              onClick={() => setMonday(PLANNING_DEFAULT_MONDAY)}
              className="ml-1 rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-brand-600 transition hover:bg-brand-50"
            >
              Cette semaine
            </button>
          )}
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-theme-sm text-error-700">
          <p className="font-semibold">
            {gaps.length} créneau{gaps.length > 1 ? "x" : ""} sans praticienne cette semaine
          </p>
          <ul className="mt-1 space-y-0.5">
            {gaps.map((g) => (
              <li key={`${g.iso}-${g.salonId}`}>
                {frLongDate(g.iso)} — {salonName(g.salonId)} : aucune praticienne présente
                alors que le salon est ouvert.
              </li>
            ))}
          </ul>
        </div>
      )}

      {vierge && gaps.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-3 text-theme-sm text-gray-500">
          Cette semaine suit les horaires habituels. Cliquez sur une case pour poser
          une absence ou un ajustement.
        </p>
      )}

      {scopedMemberCount === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-16 text-center text-theme-sm text-gray-500">
          Personne n&apos;est planifié·e à {salonName(scope)} cette semaine.
        </p>
      ) : (
        <>
          {weekHasOverrides && (
            <div className="flex items-center gap-3 text-theme-sm">
              {confirmReset ? (
                <>
                  <span className="text-gray-500">
                    Effacer tous les ajustements d&apos;horaire de cette semaine et revenir
                    à la trame habituelle ?
                  </span>
                  <button
                    type="button"
                    onClick={applyUsualHours}
                    className="font-semibold text-error-600 hover:underline"
                  >
                    Rétablir
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="font-medium text-gray-500 hover:underline"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-theme-xs font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Rétablir les horaires habituels de la semaine
                </button>
              )}
            </div>
          )}

          <PlanningGrid
            scope={scope}
            monday={monday}
            data={data}
            gapKeys={gapKeys}
            onCellClick={(member, date) => setDialog({ member, date })}
          />

          <p className="text-theme-xs text-gray-400">
            Case colorée = présence · gris = absence · vide = repos. Cliquez une case
            pour poser une absence. La pastille « RDV » ouvre la liste des rendez-vous.
          </p>
        </>
      )}

      <AbsenceDialog
        open={dialog !== null}
        member={dialog?.member ?? null}
        defaultDate={dialog?.date ?? monday}
        rdvDays={dialogRdvDays}
        onClose={() => setDialog(null)}
        onSubmit={(absence) => {
          setAbsences((list) => [...list, absence]);
          setDialog(null);
        }}
      />
    </div>
  );
}
