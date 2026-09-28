"use client";

import { useState } from "react";
import { WEEKDAYS, salons, type Weekday } from "@/lib/mock/beautyandco";
import {
  fullName,
  newStaffId,
  type DayShift,
  type Member,
} from "@/lib/mock/staff";
import MemberIdentityFields, {
  BLANK_IDENTITY,
  type IdentityDraft,
  identityValid,
  trimIdentity,
} from "./MemberIdentityFields";
import MemberSkillsPanel from "./MemberSkillsPanel";
import MemberSchedulePanel from "./MemberSchedulePanel";
import { SectionCard, btnGhost, btnPrimary } from "./ui";

type Props = {
  allMembers: Member[];
  onCancel: () => void;
  onCreate: (member: Member) => void;
  onDone: (memberId: string, invite: boolean) => void;
};

const STANDARD_DAY: DayShift = {
  off: false,
  salonId: salons[0].id,
  start: "09:00",
  end: "19:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

// Trame par défaut d'une nouvelle recrue : lun–sam travaillé, dimanche repos.
const DEFAULT_HOURS = (): Record<Weekday, DayShift> =>
  WEEKDAYS.reduce(
    (acc, d) => {
      acc[d] = d === "dim" ? { off: true } : STANDARD_DAY;
      return acc;
    },
    {} as Record<Weekday, DayShift>,
  );

export default function AddMemberFlow({ allMembers, onCancel, onCreate, onDone }: Props) {
  const [identity, setIdentity] = useState<IdentityDraft>(BLANK_IDENTITY);
  const [skills, setSkills] = useState<string[]>([]);
  const [baseHours, setBaseHours] = useState<Record<Weekday, DayShift>>(DEFAULT_HOURS);
  const [created, setCreated] = useState<Member | null>(null);

  const valid = identityValid(identity);

  // Membre fictif pour alimenter le panneau Compétences (alerte « seule
  // compétente », compteur) sans encore exister dans la liste.
  const previewMember: Member = {
    id: "draft",
    ...trimIdentity(identity),
    account: "none",
    active: true,
    skills,
    baseHours,
  };

  const submit = () => {
    if (!valid) return;
    const member: Member = {
      id: newStaffId(),
      ...trimIdentity(identity),
      account: "none",
      active: true,
      skills,
      baseHours,
    };
    onCreate(member);
    setCreated(member);
  };

  if (created) {
    return (
      <SectionCard
        title="Membre créé"
        description={`${fullName(created)} fait maintenant partie de l'équipe.`}
      >
        <p className="text-sm text-base-content/60">
          Souhaitez-vous lui envoyer tout de suite une invitation à rejoindre la
          plateforme&nbsp;? Vous pourrez aussi le faire plus tard depuis sa fiche.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={!created.email}
            onClick={() => onDone(created.id, true)}
          >
            Envoyer l&apos;invitation
          </button>
          <button type="button" className={btnGhost} onClick={() => onDone(created.id, false)}>
            Plus tard
          </button>
        </div>
        {!created.email && (
          <p className="mt-2 text-xs text-warning-600">
            Aucune adresse e-mail renseignée : l&apos;invitation devra attendre.
          </p>
        )}
      </SectionCard>
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard
        title="Identité & contact"
        description="Le minimum pour créer la fiche ; tout reste modifiable ensuite."
      >
        <MemberIdentityFields value={identity} onChange={setIdentity} />
      </SectionCard>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Compétences</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Les prestations que cette personne sait réaliser — elles conditionnent
            son apparition à la réservation.
          </p>
        </div>
        <MemberSkillsPanel
          member={previewMember}
          allMembers={allMembers}
          onChange={setSkills}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-base-content">Horaires habituels</h2>
          <p className="mt-1 text-sm text-base-content/60">
            La trame appliquée chaque semaine par le Planning.
          </p>
        </div>
        <MemberSchedulePanel baseHours={baseHours} onChange={setBaseHours} />
      </section>

      <div className="flex items-center gap-3">
        <button type="button" className={btnPrimary} disabled={!valid} onClick={submit}>
          Créer le membre
        </button>
        <button type="button" className={btnGhost} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </div>
  );
}
