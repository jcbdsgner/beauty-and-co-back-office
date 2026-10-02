"use client";

import { useMemo, useState } from "react";
import { clients } from "@/lib/mock/beautyandco";
import { BLANK_CONTACT, type Contact } from "@/lib/mock/abonnements";
import ClientSearchField, { type ClientPick } from "@/components/back-office/shared/ClientSearchField";
import { TextInput } from "./ui";

// Choix du souscripteur / acheteur : une cliente du fichier (recherche par nom
// ou téléphone), ou des coordonnées libres (le Compte n'est jamais un
// prérequis — spec §5). Choisir « Ajouter … » dans la recherche bascule sur les
// coordonnées libres, préremplies avec ce qui a été tapé.

export type ContactChoice = { clientId: string | null; contact: Contact };

const splitName = (name: string): Pick<Contact, "firstName" | "lastName"> => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
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
  const [mode, setMode] = useState<"client" | "free">(
    value.clientId || !value.contact.firstName ? "client" : "free",
  );

  const picked = value.clientId ? roster.find((c) => c.id === value.clientId) : undefined;
  const pick: ClientPick | null = picked ? { kind: "existing", client: picked } : null;

  const onPick = (next: ClientPick) => {
    if (next.kind === "existing") {
      const c = next.client;
      onChange({
        clientId: c.id,
        contact: {
          ...splitName(c.name),
          sex: c.gender,
          email: c.email,
          phone: c.phone,
          whatsapp: c.whatsapp || c.phone,
        },
      });
      return;
    }
    setMode("free");
    onChange({
      clientId: null,
      contact: { ...BLANK_CONTACT, ...splitName(next.name), phone: next.phone, whatsapp: next.phone },
    });
  };

  const switchMode = (next: "client" | "free") => {
    setMode(next);
    onChange({ clientId: null, contact: BLANK_CONTACT });
  };

  const patchFree = (patch: Partial<Contact>) =>
    onChange({ clientId: null, contact: { ...value.contact, ...patch } });

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-[15px] font-semibold text-base-content">{label}</legend>

      <div className="flex gap-5">
        <label className="flex items-center gap-2 text-sm text-base-content/80">
          <input
            type="radio"
            checked={mode === "client"}
            onChange={() => switchMode("client")}
            className="radio radio-primary radio-sm"
          />
          Cliente du fichier
        </label>
        <label className="flex items-center gap-2 text-sm text-base-content/80">
          <input
            type="radio"
            checked={mode === "free"}
            onChange={() => switchMode("free")}
            className="radio radio-primary radio-sm"
          />
          Hors fichier
        </label>
      </div>

      {mode === "client" ? (
        <ClientSearchField
          scope="all"
          value={pick}
          onChange={onPick}
          placeholder="Nom ou téléphone de la cliente…"
        />
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
