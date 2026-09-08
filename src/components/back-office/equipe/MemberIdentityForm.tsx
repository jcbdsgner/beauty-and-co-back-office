"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/icons";
import type { Member } from "@/lib/mock/staff";
import { fullName } from "@/lib/mock/staff";
import MemberIdentityFields, {
  type IdentityDraft,
  identityValid,
  trimIdentity,
} from "./MemberIdentityFields";
import { Divider, SectionCard, Toggle, btnPrimary } from "./ui";

type Props = {
  member: Member;
  onSave: (identity: IdentityDraft) => void;
  onSetActive: (active: boolean) => void;
};

const draftOf = (m: Member): IdentityDraft => ({
  firstName: m.firstName,
  lastName: m.lastName,
  phone: m.phone,
  email: m.email,
  category: m.category,
  roles: m.roles,
  salonIds: m.salonIds,
});

export default function MemberIdentityForm({ member, onSave, onSetActive }: Props) {
  const initial = draftOf(member);
  const [draft, setDraft] = useState<IdentityDraft>(initial);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(member));
  const canSave = identityValid(draft) && dirty;

  return (
    <SectionCard
      title="Identité & contact"
      description="Coordonnées, métier, rôles et salons de rattachement."
    >
      <MemberIdentityFields
        value={draft}
        onChange={(next) => {
          setDraft(next);
          setJustSaved(false);
        }}
      />

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            const trimmed = trimIdentity(draft);
            setDraft(trimmed);
            onSave(trimmed);
            setJustSaved(true);
          }}
          className={btnPrimary}
        >
          Enregistrer
        </button>
        {justSaved && !dirty && (
          <span className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-success-600">
            <CheckCircleIcon className="size-4" />
            Enregistré
          </span>
        )}
      </div>

      <div className="mt-6">
        <Divider />
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">Membre actif</p>
          <p className="mt-0.5 text-theme-xs text-gray-500">
            Un membre désactivé disparaît du Planning et de la réservation, mais
            garde tout son historique.
          </p>
          {confirmOff && (
            <p className="mt-2 flex items-center gap-2 text-theme-xs">
              <span className="text-gray-500">Désactiver {fullName(member)} ?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmOff(false);
                  onSetActive(false);
                }}
                className="font-semibold text-error-600 hover:underline"
              >
                Désactiver
              </button>
              <button
                type="button"
                onClick={() => setConfirmOff(false)}
                className="font-medium text-gray-500 hover:underline"
              >
                Annuler
              </button>
            </p>
          )}
        </div>
        <div className="shrink-0 pt-0.5">
          <Toggle
            checked={member.active}
            onChange={(on) => {
              if (on) onSetActive(true);
              else setConfirmOff(true);
            }}
            aria-label="Membre actif"
          />
        </div>
      </div>
    </SectionCard>
  );
}
