"use client";

import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import Alert from "@/components/ui/alert/Alert";
import { Button } from "@/components/ui/atoms/button";
import type { Member } from "@/lib/mock/staff";
import SkillsDialog, { SKILL_GROUPS, SKILL_TOTAL, soleProviderIds } from "./SkillsDialog";

// Onglet « Compétences » de la fiche membre — un récap écrit, en lecture :
// ce que la personne sait faire, catégorie par catégorie. La modification se
// fait dans une fenêtre dédiée (`SkillsDialog`), avec recherche.
//
// 1. La propriétaire vient vérifier « qui sait faire quoi » (souvent avant
//    d'affecter un RDV ou de recruter) — lecture rapide, pas un formulaire.
// 2. Ce qui saute aux yeux : la liste des prestations réalisées, groupée.
// 3. Cas dégradés : aucune compétence (praticienne invisible à la réservation),
//    seule compétente sur une prestation, poste sans prestation (caisse…).

type Props = {
  member: Member;
  // Tous les membres (état de session) — pour détecter la « seule compétente ».
  allMembers: Member[];
  onChange: (skills: string[]) => void;
};

export default function MemberSkillsPanel({ member, allMembers, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const isPractitioner = member.roles.includes("praticienne");
  const selected = useMemo(() => new Set(member.skills), [member.skills]);

  const groups = SKILL_GROUPS.map((g) => ({
    ...g,
    done: g.prestations.filter((p) => selected.has(p.id)),
  }));
  const covered = groups.filter((g) => g.done.length > 0);
  const untouched = groups.filter((g) => g.done.length === 0);

  const sole = useMemo(
    () => soleProviderIds(member, allMembers, member.skills),
    [member, allMembers],
  );
  const soleNames = groups.flatMap((g) => g.done.filter((p) => sole.has(p.id)).map((p) => p.name));

  return (
    <div className="space-y-5">
      {isPractitioner && member.skills.length === 0 && (
        <Alert
          variant="warning"
          title="Aucune compétence renseignée"
          message={`Sans au moins une prestation, ${member.firstName} n'est jamais proposée à la réservation.`}
        />
      )}

      <section className="rounded-box border border-base-300 bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-base-300 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-base-content">Prestations réalisées</h2>
            <p className="mt-0.5 text-sm text-base-content/60">
              {member.skills.length === 0
                ? "Aucune prestation pour le moment."
                : `${member.skills.length} prestation${member.skills.length > 1 ? "s" : ""} sur ${SKILL_TOTAL} au catalogue`}
            </p>
          </div>
          <Button
            variant={member.skills.length === 0 ? "brand" : "outline"}
            size="sm"
            icon={<Pencil className="size-4" />}
            onClick={() => setEditing(true)}
          >
            {member.skills.length === 0 ? "Ajouter des compétences" : "Modifier les compétences"}
          </Button>
        </header>

        {covered.length === 0 ? (
          <p className="px-6 py-8 text-[15px] text-base-content/60">
            {isPractitioner
              ? `Indiquez les prestations que ${member.firstName} sait réaliser : c'est ce qui permet de lui affecter des rendez-vous.`
              : "Ce poste ne réalise pas de prestations. Vous pouvez tout de même en renseigner si besoin."}
          </p>
        ) : (
          <dl className="divide-y divide-base-300">
            {covered.map((g) => (
              <div key={g.id} className="grid grid-cols-[200px_1fr] gap-6 px-6 py-5">
                <dt>
                  <p className="text-[15px] font-semibold text-base-content">{g.label}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-base-content/60">
                    {g.done.length === g.prestations.length
                      ? `Toutes (${g.prestations.length})`
                      : `${g.done.length} sur ${g.prestations.length}`}
                  </p>
                </dt>
                <dd>
                  <ul className="columns-2 gap-8 text-[15px] leading-7 text-base-content/85">
                    {g.done.map((p) => (
                      <li key={p.id} className="break-inside-avoid">
                        {p.name}
                        {sole.has(p.id) && (
                          <span className="ml-1.5 text-sm text-warning-700">· seule à la réaliser</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
            {untouched.length > 0 && (
              <div className="grid grid-cols-[200px_1fr] gap-6 px-6 py-4">
                <dt className="text-sm text-base-content/60">Non réalisées</dt>
                <dd className="text-sm text-base-content/60">
                  {untouched.map((g) => g.label).join(" · ")}
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {soleNames.length > 0 && (
        <p className="text-sm text-base-content/60">
          {member.firstName} est la seule praticienne active à réaliser{" "}
          {soleNames.length === 1 ? "cette prestation" : `ces ${soleNames.length} prestations`} :
          si elle est absente, elles ne peuvent pas être réservées.
        </p>
      )}

      <SkillsDialog
        open={editing}
        member={member}
        allMembers={allMembers}
        onClose={() => setEditing(false)}
        onSave={(skills) => {
          onChange(skills);
          setEditing(false);
        }}
      />
    </div>
  );
}
