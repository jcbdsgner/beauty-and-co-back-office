"use client";

import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import {
  ROLE_OPTIONS,
  type StaffCategory,
  type StaffRole,
} from "@/lib/mock/staff";
import { CheckPill, TextInput } from "./ui";

// Le métier range la personne dans le Planning (filtres Coiffeurs / Esthéticiens,
// comme point-de-vente) ; « Autre » = caisse, accueil, ménage, manager.
const METIER_OPTIONS: { value: StaffCategory; label: string }[] = [
  { value: "coiffure", label: "Coiffure" },
  { value: "esthetique", label: "Esthétique" },
  { value: "staff", label: "Autre" },
];

const GENDER_OPTIONS = [
  { value: "f", label: "Femme" },
  { value: "m", label: "Homme" },
];

export type IdentityDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: "f" | "m";
  category: StaffCategory;
  roles: StaffRole[];
};

export const BLANK_IDENTITY: IdentityDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  gender: "f",
  category: "coiffure",
  roles: ["praticienne"],
};

// Une praticienne est forcément coiffeuse ou esthéticienne.
const metierMissing = (d: IdentityDraft) => d.roles.includes("praticienne") && d.category === "staff";

export const identityValid = (d: IdentityDraft) =>
  d.firstName.trim().length > 0 && d.roles.length > 0 && !metierMissing(d);

export const trimIdentity = (d: IdentityDraft): IdentityDraft => ({
  ...d,
  firstName: d.firstName.trim(),
  lastName: d.lastName.trim(),
  phone: d.phone.trim(),
  email: d.email.trim(),
});

type Props = {
  value: IdentityDraft;
  onChange: (next: IdentityDraft) => void;
};

export default function MemberIdentityFields({ value, onChange }: Props) {
  const set = <K extends keyof IdentityDraft>(key: K, v: IdentityDraft[K]) =>
    onChange({ ...value, [key]: v });

  const toggleRole = (role: StaffRole) =>
    set(
      "roles",
      value.roles.includes(role)
        ? value.roles.filter((r) => r !== role)
        : [...value.roles, role],
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Prénom"
          placeholder="Bineta"
          value={value.firstName}
          onChange={(v) => set("firstName", v)}
        />
        <TextInput
          label="Nom"
          placeholder="Facultatif"
          value={value.lastName}
          onChange={(v) => set("lastName", v)}
        />
        <TextInput
          label="Téléphone"
          placeholder="+221 77 000 00 00"
          value={value.phone}
          onChange={(v) => set("phone", v)}
        />
        <TextInput
          label="E-mail"
          placeholder="prenom.nom@beautyandco.sn"
          value={value.email}
          onChange={(v) => set("email", v)}
          hint="Sert à l'invitation sur la plateforme."
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div>
          <span className="mb-2 block text-sm font-medium text-base-content">Métier</span>
          <SegmentedToggle
            size="sm"
            className="w-80"
            value={value.category}
            onChange={(v) => set("category", v as StaffCategory)}
            options={METIER_OPTIONS}
            aria-label="Métier"
          />
          {metierMissing(value) ? (
            <p className="mt-2 text-xs text-warning-600">
              Une praticienne est coiffeuse ou esthéticienne.
            </p>
          ) : (
            <p className="mt-2 text-xs text-base-content/55">
              Range la personne parmi les Coiffeurs ou les Esthéticiens du Planning.
            </p>
          )}
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium text-base-content">Genre</span>
          <SegmentedToggle
            size="sm"
            className="w-52"
            value={value.gender}
            onChange={(v) => set("gender", v as "f" | "m")}
            options={GENDER_OPTIONS}
            aria-label="Genre"
          />
          <p className="mt-2 text-xs text-base-content/55">Accorde « Coiffeuse » / « Coiffeur ».</p>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-base-content">Rôles</span>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((o) => (
            <CheckPill
              key={o.value}
              checked={value.roles.includes(o.value)}
              onToggle={() => toggleRole(o.value)}
            >
              {o.label}
            </CheckPill>
          ))}
        </div>
        {value.roles.length === 0 && (
          <p className="mt-2 text-xs text-warning-600">
            Choisissez au moins un rôle.
          </p>
        )}
      </div>
    </div>
  );
}
