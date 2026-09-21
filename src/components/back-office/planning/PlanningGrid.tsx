"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WEEKDAY_LABELS,
  salonName,
  type SalonScope,
} from "@/lib/mock/beautyandco";
import {
  ABSENCE_LABELS,
  hasNoBaseHours,
  shiftRangeLabel,
  weekPresence,
  type PlanningData,
  type Presence,
} from "@/lib/mock/planning";
import { rdvCountByStaffDay } from "@/lib/mock/rendezvous";
import { ROLE_LABELS, fullName, type Member } from "@/lib/mock/staff";
import { accentForMemberId, type StaffAccent } from "@/lib/mock/staff-colors";

type Props = {
  scope: SalonScope;
  monday: string;
  data: PlanningData;
  gapKeys: Set<string>; // `${iso}` — jours avec au moins un salon découvert
  onCellClick: (member: Member, iso: string) => void;
};

const dayAbbr = (label: string) => `${label.slice(0, 3)}.`;
const dayNumber = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

function PresenceCell({
  presence,
  member,
  scope,
  accent,
  rdvCount,
  onClick,
  onOpenRdv,
}: {
  presence: Presence;
  member: Member;
  scope: SalonScope;
  accent: StaffAccent;
  rdvCount: number;
  onClick: () => void;
  onOpenRdv: () => void;
}) {
  const base =
    "relative flex h-full min-h-16 w-full flex-col justify-center gap-1 border-l border-gray-100 px-2 py-2 text-left text-theme-xs transition";

  let body: React.ReactNode;
  let toneStyle: React.CSSProperties = {};
  let tone = "hover:bg-gray-50";

  if (presence.state === "present") {
    // Filtré sur un salon précis : si la présence du jour est ailleurs, on
    // l'affiche quand même (elle travaille) mais en tons neutres — elle ne
    // compte pas pour LE salon affiché. Vue « Tous les salons » : toujours
    // préciser le salon, personne n'en a un par défaut.
    const here = scope === "all" || presence.salonId === scope;
    tone = here ? "hover:brightness-95" : "bg-gray-50 hover:bg-gray-100";
    if (here) toneStyle = { backgroundColor: accent.bg };
    body = (
      <>
        <span className="font-medium" style={{ color: here ? accent.text : "#6b7280" }}>
          {shiftRangeLabel(presence)}
        </span>
        {(scope === "all" || !here) && (
          <span className={here ? "" : "text-gray-400"} style={here ? { color: accent.text, opacity: 0.75 } : undefined}>
            {salonName(presence.salonId)}
          </span>
        )}
      </>
    );
  } else if (presence.state === "absent") {
    tone = "bg-warning-50 hover:bg-warning-100/70";
    body = (
      <span className="font-medium text-warning-700" title={presence.reason ?? undefined}>
        {ABSENCE_LABELS[presence.type]}
      </span>
    );
  } else {
    body = <span className="text-gray-300">·</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Modifier la présence de ${fullName(member)}`}
      className={`${base} ${tone}`}
      style={toneStyle}
    >
      {body}
      {rdvCount > 0 && (
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onOpenRdv();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              onOpenRdv();
            }
          }}
          className="mt-0.5 inline-flex w-fit items-center rounded-full bg-white px-1.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset hover:brightness-95"
          style={{ color: accent.text, boxShadow: `inset 0 0 0 1px ${accent.border}55` }}
        >
          {rdvCount} RDV
        </span>
      )}
    </button>
  );
}

export default function PlanningGrid({
  scope,
  monday,
  data,
  gapKeys,
  onCellClick,
}: Props) {
  const router = useRouter();
  const [showOthers, setShowOthers] = useState(false);

  const { days, rows } = useMemo(
    () => weekPresence(scope, monday, data),
    [scope, monday, data],
  );

  const rdvIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rdvCountByStaffDay(scope)) {
      map.set(`${r.date}__${r.staffFirstName}`, r.count);
    }
    return map;
  }, [scope]);

  const practitioners = rows.filter((r) => r.member.roles.includes("praticienne"));
  const others = rows.filter((r) => !r.member.roles.includes("praticienne"));

  const gridCols = "190px repeat(7, minmax(0, 1fr))";

  const renderRow = (member: Member, cells: Presence[]) => {
    const accent = accentForMemberId(member.id);
    return (
      <div
        key={member.id}
        className="grid border-t border-l-[3px] border-gray-100"
        style={{ gridTemplateColumns: gridCols, borderLeftColor: accent.dot }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
            style={{ backgroundColor: accent.dot }}
          >
            {member.firstName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-theme-sm font-semibold" style={{ color: accent.text }}>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent.dot }} />
              {fullName(member)}
            </p>
            {hasNoBaseHours(member) ? (
              <p className="text-[13px] text-warning-600">Aucun horaire défini — voir la fiche</p>
            ) : (
              <p className="truncate text-[13px] text-gray-400">
                {member.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
              </p>
            )}
          </div>
        </div>
        {days.map((d, i) =>
          d.closed ? (
            <div
              key={d.iso}
              className="border-l border-gray-100 bg-gray-50/60"
              aria-hidden="true"
            />
          ) : (
            <PresenceCell
              key={d.iso}
              presence={cells[i]}
              member={member}
              scope={scope}
              accent={accent}
              rdvCount={rdvIndex.get(`${d.iso}__${member.firstName}`) ?? 0}
              onClick={() => onCellClick(member, d.iso)}
              onOpenRdv={() => router.push("/rendez-vous")}
            />
          ),
        )}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <div className="min-w-[900px]">
        {/* En-tête des jours */}
        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div className="px-3 py-3" />
          {days.map((d) => {
            const gap = gapKeys.has(d.iso);
            return (
              <div
                key={d.iso}
                className={`border-l border-gray-100 px-2 py-3 text-center ${
                  gap ? "bg-error-50" : d.closed ? "bg-gray-50/60" : ""
                }`}
              >
                <p className="text-theme-sm font-semibold text-gray-800">
                  {dayAbbr(WEEKDAY_LABELS[d.weekday])} {dayNumber(d.iso)}
                </p>
                {d.closed ? (
                  <p className="mt-0.5 text-[13px] font-medium text-gray-400">
                    {d.closure ? `Fermé — ${d.closure}` : "Fermé"}
                  </p>
                ) : gap ? (
                  <p className="mt-0.5 text-[13px] font-semibold text-error-600">
                    Personne
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {practitioners.map((r) => renderRow(r.member, r.cells))}

        {others.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowOthers((v) => !v)}
              className="flex w-full items-center gap-2 border-t border-gray-100 bg-gray-50/50 px-3 py-2 text-theme-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <span className={`transition-transform ${showOthers ? "rotate-90" : ""}`}>›</span>
              Reste de l&apos;équipe ({others.length})
            </button>
            {showOthers && others.map((r) => renderRow(r.member, r.cells))}
          </>
        )}
      </div>
    </div>
  );
}
