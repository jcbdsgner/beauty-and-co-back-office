"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SelectField, TextInput, btnGhost, btnPrimary } from "@/components/back-office/fidelite/ui";
import {
  PREFERENCE_GROUPS,
  salons,
  type ClientGender,
  type ClientPreferences,
  type SalonId,
} from "@/lib/mock/beautyandco";
import type { ClientCoordonnees, NewClientDraft } from "@/context/ClientsContext";

// Trois petits dialogs de formulaire pour la fiche/le répertoire clientèle —
// calqués sur `NewClientDialog` / `EditCoordonneesDialog` / `EditPreferencesDialog`
// de point-de-vente (`components/clientele/`), absents de back-office jusqu'ici
// (voir audit de parité 2026-09-22). Chrome `ui/modal`, primitives `fidelite/ui`
// déjà partagées par le reste de l'app.

const GENDER_OPTIONS: { value: ClientGender; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
];

/* ------------------------------------------------------------ Nouvelle cliente */

export function NewClientDialog({
  open,
  defaultSalon,
  initialName = "",
  onClose,
  onCreate,
}: {
  open: boolean;
  defaultSalon: SalonId;
  initialName?: string;
  onClose: () => void;
  onCreate: (draft: NewClientDraft) => void;
}) {
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState<ClientGender>("femme");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [salon, setSalon] = useState<SalonId>(defaultSalon);
  const [attempted, setAttempted] = useState(false);
  const [opened, setOpened] = useState(open);

  // Reprend le nom pré-saisi (recherche sans résultat) à chaque nouvelle
  // ouverture — même idiome que les autres dialogs de ce fichier.
  if (open !== opened) {
    setOpened(open);
    if (open) setName(initialName);
  }

  const reset = () => {
    setName("");
    setGender("femme");
    setPhone("");
    setEmail("");
    setAddress("");
    setSalon(defaultSalon);
    setAttempted(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const invalid = name.trim().length < 2 || phone.trim() === "";

  const submit = () => {
    setAttempted(true);
    if (invalid) return;
    onCreate({
      name: name.trim(),
      gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || "Dakar",
      salon,
    });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={close} showCloseButton={false} className="max-w-lg m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800">Nouvelle cliente</h3>
        <p className="mt-1 text-theme-sm text-gray-500">
          Créée pour cette session — coordonnées et préférences restent modifiables ensuite depuis
          sa fiche.
        </p>

        <div className="mt-6 space-y-4">
          <TextInput label="Nom complet" value={name} onChange={setName} placeholder="Nom et prénom" />
          {attempted && name.trim().length < 2 && (
            <p className="-mt-3 text-theme-xs text-error-600">Indiquez le nom de la cliente.</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Genre" value={gender} onChange={setGender} options={GENDER_OPTIONS} />
            <SelectField
              label="Salon"
              value={salon}
              onChange={setSalon}
              options={salons.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>
          <TextInput label="Téléphone" value={phone} onChange={setPhone} placeholder="+221 77 000 00 00" />
          {attempted && phone.trim() === "" && (
            <p className="-mt-3 text-theme-xs text-error-600">Indiquez un numéro de téléphone.</p>
          )}
          <TextInput label="Email" value={email} onChange={setEmail} placeholder="cliente@exemple.com" />
          <TextInput label="Adresse" value={address} onChange={setAddress} placeholder="Quartier, ville" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button type="button" onClick={submit} className={btnPrimary}>
            Créer la fiche
          </button>
          <button type="button" onClick={close} className={btnGhost}>
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ Coordonnées */

export function EditCoordonneesDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ClientCoordonnees;
  onClose: () => void;
  onSave: (patch: ClientCoordonnees) => void;
}) {
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [opened, setOpened] = useState(open);

  // Recharge les valeurs de départ à chaque (ré)ouverture, sans effet — même
  // idiome que `AbsenceDialog` (clé qui change pendant le rendu plutôt qu'un
  // `useEffect`).
  if (open !== opened) {
    setOpened(open);
    if (open) {
      setPhone(initial.phone);
      setEmail(initial.email);
      setAddress(initial.address);
    }
  }

  const submit = () => {
    onSave({ phone: phone.trim(), email: email.trim(), address: address.trim() });
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="max-w-md m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800">Modifier les coordonnées</h3>
        <div className="mt-6 space-y-4">
          <TextInput label="Téléphone" value={phone} onChange={setPhone} />
          <TextInput label="Email" value={email} onChange={setEmail} />
          <TextInput label="Adresse" value={address} onChange={setAddress} />
        </div>
        <div className="mt-6 flex items-center gap-2">
          <button type="button" onClick={submit} className={btnPrimary}>
            Enregistrer
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ Préférences */

export function EditPreferencesDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ClientPreferences;
  onClose: () => void;
  onSave: (group: keyof ClientPreferences, items: string[]) => void;
}) {
  const [draft, setDraft] = useState<Record<keyof ClientPreferences, string>>(() =>
    Object.fromEntries(
      PREFERENCE_GROUPS.map((g) => [g.key, initial[g.key].join(", ")]),
    ) as Record<keyof ClientPreferences, string>,
  );
  const [opened, setOpened] = useState(open);

  if (open !== opened) {
    setOpened(open);
    if (open) {
      setDraft(
        Object.fromEntries(
          PREFERENCE_GROUPS.map((g) => [g.key, initial[g.key].join(", ")]),
        ) as Record<keyof ClientPreferences, string>,
      );
    }
  }

  const submit = () => {
    for (const g of PREFERENCE_GROUPS) {
      const items = draft[g.key]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      onSave(g.key, items);
    }
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="max-w-lg m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800">Modifier les préférences</h3>
        <p className="mt-1 text-theme-sm text-gray-500">Une préférence par virgule.</p>
        <div className="mt-6 space-y-4">
          {PREFERENCE_GROUPS.map((g) => (
            <div key={g.key}>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">{g.label}</label>
              <textarea
                rows={2}
                value={draft[g.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [g.key]: e.target.value }))}
                placeholder="Aucune préférence"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2">
          <button type="button" onClick={submit} className={btnPrimary}>
            Enregistrer
          </button>
          <button type="button" onClick={onClose} className={btnGhost}>
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
