"use client";

import { useMemo } from "react";
import Alert from "@/components/ui/alert/Alert";
import {
  durationLabel,
  fcfa,
  prestationSeeds,
  serviceSeeds,
} from "@/lib/mock/services";
import type { Member } from "@/lib/mock/staff";
import { CheckPill } from "./ui";

type Props = {
  member: Member;
  // Tous les membres (état de session) — pour détecter la « dernière compétente ».
  allMembers: Member[];
  onChange: (skills: string[]) => void;
};

// Prestations regroupées par service, dans l'ordre du catalogue ;
// « Sans catégorie » en dernier.
const GROUPS = [
  ...serviceSeeds.map((s) => ({
    id: s.id,
    label: s.name,
    prestations: prestationSeeds.filter((p) => p.serviceId === s.id),
  })),
  {
    id: "orphelines",
    label: "Sans catégorie",
    prestations: prestationSeeds.filter((p) => p.serviceId === null),
  },
].filter((g) => g.prestations.length > 0);

const TOTAL = prestationSeeds.length;

export default function MemberSkillsPanel({ member, allMembers, onChange }: Props) {
  const isPractitioner = member.roles.includes("praticienne");
  const selected = useMemo(() => new Set(member.skills), [member.skills]);

  const toggle = (prestationId: string) => {
    const next = new Set(selected);
    if (next.has(prestationId)) next.delete(prestationId);
    else next.add(prestationId);
    onChange([...next]);
  };

  // Prestations pour lesquelles cette personne est aujourd'hui la seule
  // praticienne active compétente : les décocher les rend irréalisables.
  const soleProvider = useMemo(() => {
    const others = allMembers.filter(
      (m) => m.id !== member.id && m.active && m.roles.includes("praticienne"),
    );
    return prestationSeeds.filter(
      (p) =>
        selected.has(p.id) &&
        !others.some((m) => m.skills.includes(p.id)),
    );
  }, [allMembers, member.id, selected]);

  return (
    <div className="space-y-5">
      {isPractitioner && member.skills.length === 0 && (
        <Alert
          variant="warning"
          title="Aucune compétence cochée"
          message="Sans au moins une prestation, cette praticienne n'apparaîtra jamais dans la liste des personnes à la réservation."
        />
      )}

      {soleProvider.length > 0 && (
        <Alert
          variant="warning"
          title="Seule personne compétente"
          message={`Pour ${soleProvider
            .map((p) => p.name)
            .join(", ")}, cette personne est la seule praticienne active à savoir la réaliser. La décocher rend la prestation impossible à réserver.`}
        />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-800">Prestations réalisées</h2>
          <span className="text-theme-xs font-medium text-gray-500">
            {member.skills.length} sur {TOTAL}
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {GROUPS.map((g) => (
            <div key={g.id} className="px-6 py-4">
              <p className="mb-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
                {g.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.prestations.map((p) => (
                  <CheckPill
                    key={p.id}
                    checked={selected.has(p.id)}
                    onToggle={() => toggle(p.id)}
                  >
                    <span>
                      {p.name}
                      <span className="ml-1.5 font-normal text-gray-400">
                        {fcfa(p.priceFcfa)} · {durationLabel(p.durationMin)}
                      </span>
                    </span>
                  </CheckPill>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
