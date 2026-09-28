"use client";

import { useMemo } from "react";
import { clients } from "@/lib/mock/beautyandco";
import { BLANK_CONTACT, type Contact } from "@/lib/mock/abonnements";
import { TextInput } from "./ui";

// Choix du souscripteur / acheteur : une cliente du fichier, ou des coordonnées
// libres (le Compte n'est jamais un prérequis — spec §5).

export type ContactChoice = { clientId: string | null; contact: Contact };

const splitName = (name: string): Pick<Contact, "firstName" | "lastName"> => {
  const [firstName, ...rest] = name.split(" ");
  return { firstName: firstName ?? "", lastName: rest.join(" ") };
};

export default function ContactField({
  value,
  onChange,
  label = "Souscripteur",
}: {
  value: ContactChoice;
  onChange: (next: ContactChoice) => void;
  label?: string;
}) {
  const roster = useMemo(() => clients("all"), []);
  const mode: "client" | "free" = value.clientId ? "client" : "free";

  const pickClient = (id: string) => {
    if (!id) {
      onChange({ clientId: null, contact: BLANK_CONTACT });
      return;
    }
    const c = roster.find((x) => x.id === id);
    if (!c) return;
    onChange({
      clientId: c.id,
      contact: {
        ...splitName(c.name),
        sex: c.gender,
        email: c.email,
        phone: c.phone,
        whatsapp: c.phone,
      },
    });
  };

  const patchFree = (patch: Partial<Contact>) =>
    onChange({ clientId: null, contact: { ...value.contact, ...patch } });

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-sm font-medium text-base-content">{label}</legend>

      <div className="flex gap-2">
        <label className="flex items-center gap-2 text-sm text-base-content/80">
          <input
            type="radio"
            checked={mode === "client"}
            onChange={() => pickClient(roster[0]?.id ?? "")}
            className="text-brand-500 focus:ring-brand-500/20"
          />
          Cliente du fichier
        </label>
        <label className="flex items-center gap-2 text-sm text-base-content/80">
          <input
            type="radio"
            checked={mode === "free"}
            onChange={() => onChange({ clientId: null, contact: BLANK_CONTACT })}
            className="text-brand-500 focus:ring-brand-500/20"
          />
          Autre personne
        </label>
      </div>

      {mode === "client" ? (
        <select
          value={value.clientId ?? ""}
          onChange={(e) => pickClient(e.target.value)}
          className="h-11 w-full rounded-field border border-base-300 bg-white px-4 text-sm text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
        >
          {roster.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.salonLabel}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Prénom"
            value={value.contact.firstName}
            onChange={(v) => patchFree({ firstName: v })}
          />
          <TextInput
            label="Nom"
            value={value.contact.lastName}
            onChange={(v) => patchFree({ lastName: v })}
          />
          <TextInput
            label="Email"
            value={value.contact.email}
            onChange={(v) => patchFree({ email: v })}
          />
          <TextInput
            label="Téléphone"
            value={value.contact.phone}
            onChange={(v) => patchFree({ phone: v, whatsapp: v })}
          />
        </div>
      )}
    </fieldset>
  );
}
