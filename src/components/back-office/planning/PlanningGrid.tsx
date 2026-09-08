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
import { ROLE_LABELS, fullName, initials, type Member } from "@/lib/mock/staff";
import { Avatar } from "../equipe/ui";

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
  rdvCount,
  onClick,
  onOpenRdv,
}: {
  presence: Presence;
  member: Member;
  rdvCount: number;
  onClick: () => void;
  onOpenRdv: () => void;
}) {
  const base =
    "relative flex h-full min-h-16 w-full flex-col justify-center gap-1 border-l border-gray-100 px-2 py-2 text-left text-theme-xs transition";

  let body: React.ReactNode;
  let tone = "hover:bg-gray-50";

  if (presence.state === "present") {
    tone = "bg-brand-50/70 hover:bg-brand-50";
    const elsewhere =
      member.salonIds.length > 0 && presence.salonId !== member.salonIds[0];
    body = (
      <>
        <span className="font-medium text-gray-800">{shiftRangeLabel(presence)}</span>
        {elsewhere && (
          <span className="text-brand-700">↦ {salonName(presence.salonId)}</span>
        )}
      </>
    );
  } else if (presence.state === "absent") {
    tone = "bg-gray-100 hover:bg-gray-200/70";
    body = (
      <span className="font-medium text-gray-500" title={presence.reason ?? undefined}>
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
          className="mt-0.5 inline-flex w-fit items-center rounded-full bg-white px-1.5 py-0.5 text-[13px] font-medium text-gray-600 ring-1 ring-gray-200 hover:text-brand-700 hover:ring-brand-300"
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

  const renderRow = (member: Member, cells: Presence[]) => (
    <div key={member.id} className="grid border-t border-gray-100" style={{ gridTemplateColumns: gridCols }}>
      <div className="flex items-center gap-2.5 px-3 py-2">
        <Avatar initials={initials(member)} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-theme-sm font-medium text-gray-800">
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
            rdvCount={rdvIndex.get(`${d.iso}__${member.firstName}`) ?? 0}
            onClick={() => onCellClick(member, d.iso)}
            onOpenRdv={() => router.push("/rendez-vous")}
          />
        ),
      )}
    </div>
  );

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
