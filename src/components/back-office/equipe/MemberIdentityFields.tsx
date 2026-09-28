"use client";

import {
  CATEGORY_OPTIONS,
  ROLE_OPTIONS,
  type StaffCategory,
  type StaffRole,
} from "@/lib/mock/staff";
import { CheckPill, SelectField, TextInput } from "./ui";

export type IdentityDraft = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  category: StaffCategory;
  roles: StaffRole[];
};

export const BLANK_IDENTITY: IdentityDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  category: "coiffure",
  roles: ["praticienne"],
};

export const identityValid = (d: IdentityDraft) =>
  d.firstName.trim().length > 0 && d.lastName.trim().length > 0 && d.roles.length > 0;

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
          placeholder="Sophie"
          value={value.firstName}
          onChange={(v) => set("firstName", v)}
        />
        <TextInput
          label="Nom"
          placeholder="Ndione"
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

      <div className="max-w-xs">
        <SelectField
          label="Métier"
          value={value.category}
          onChange={(v) => set("category", v)}
          options={CATEGORY_OPTIONS}
        />
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
