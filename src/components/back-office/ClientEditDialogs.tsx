"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Check } from "lucide-react";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { Field } from "@/components/ui/molecules/field";
import { Alert } from "@/components/ui/molecules/alert";
import { Card } from "@/components/ui/atoms/card";
import { FieldLabel } from "@/components/ui/atoms/field-label";
import { Button } from "@/components/ui/atoms/button";
import { TextInput as Input } from "@/components/ui/atoms/text-input";
import { Select } from "@/components/ui/atoms/select";
import { Textarea } from "@/components/ui/atoms/textarea";
import { cn } from "@/lib/utils";
import { latestChoices, type PreferenceQuestion } from "@/lib/mock/preferences";
import { PREFERENCE_RUBRICS, rubricOf } from "@/lib/mock/preference-targets";
import { TextInput, btnGhost, btnPrimary } from "@/components/back-office/fidelite/ui";
import {
  BirthdaySelect,
  birthdayFromParts,
  birthdayParts,
  type BirthdayParts,
} from "@/components/back-office/shared/BirthdaySelect";
import {
  ETHNICITY_OPTIONS,
  PAYS_DEFAUT,
  PAYS_OPTIONS,
  salons,
  type ClientEthnicity,
  type ClientGender,
  type ClientPreferences,
  type ClientRow,
  type SalonId,
} from "@/lib/mock/beautyandco";
import type { ClientCoordonnees, NewClientDraft } from "@/context/ClientsContext";

// Dialogs de formulaire de la clientèle — repris de point-de-vente, qui fait
// autorité (`components/clientele/{new-client-dialog,edit-coordonnees-dialog,
// preferences-dialog}.tsx`) : mêmes champs, mêmes obligations (prénom, nom,
// téléphone, e-mail, pays de résidence, ethnicité, anniversaire jour + mois),
// même alerte de doublon de téléphone. Écarts back-office : genre (accord des
// libellés « cliente / client ») et salon habituel (filtre salon du répertoire).

const GENDER_OPTIONS: { value: ClientGender; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
];

const digits = (s: string) => s.replace(/\D/g, "");

/* ------------------------------------------------------------ Nouvelle cliente */

export type NewClientPrefill = { firstName?: string; lastName?: string; phone?: string };

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  profession: "",
  residenceCountry: PAYS_DEFAUT,
  ethnicity: "",
  gender: "femme" as ClientGender,
  hairType: "",
  colorReference: "",
};

export function NewClientDialog({
  open,
  defaultSalon,
  initialValues,
  existing,
  onClose,
  onCreate,
}: {
  open: boolean;
  defaultSalon: SalonId;
  initialValues?: NewClientPrefill;
  /** Fiches existantes — pour signaler un téléphone déjà utilisé. */
  existing: ClientRow[];
  onClose: () => void;
  onCreate: (draft: NewClientDraft, profile: { hairType?: string; colorReference?: string }) => void;
}) {
  // Monté seulement ouvert : chaque ouverture repart d'un formulaire neuf.
  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton className="m-4 max-h-[90vh] max-w-2xl overflow-y-auto">
      {open && (
        <NewClientForm
          defaultSalon={defaultSalon}
          initialValues={initialValues}
          existing={existing}
          onClose={onClose}
          onCreate={onCreate}
        />
      )}
    </Modal>
  );
}

function NewClientForm({
  defaultSalon,
  initialValues,
  existing,
  onClose,
  onCreate,
}: {
  defaultSalon: SalonId;
  initialValues?: NewClientPrefill;
  existing: ClientRow[];
  onClose: () => void;
  onCreate: (draft: NewClientDraft, profile: { hairType?: string; colorReference?: string }) => void;
}) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [salon, setSalon] = useState<SalonId>(defaultSalon);
  const [birthday, setBirthday] = useState<BirthdayParts>({ day: "", month: "" });
  const [attempted, setAttempted] = useState(false);

  const findDuplicate = (phone: string) =>
    digits(phone).length >= 6 ? existing.find((c) => digits(c.phone) === digits(phone)) : undefined;
  const [duplicate, setDuplicate] = useState<ClientRow | undefined>(() => findDuplicate(initialValues?.phone ?? ""));

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const birthdayValue = birthdayFromParts(birthday);
  const canSubmit =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.email.trim() !== "" &&
    form.residenceCountry.trim() !== "" &&
    form.ethnicity !== "" &&
    birthdayValue !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (!canSubmit) return;
    onCreate(
      {
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        gender: form.gender,
        salon,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        profession: form.profession.trim(),
        residenceCountry: form.residenceCountry,
        birthday: birthdayValue!,
        ethnicity: form.ethnicity as ClientEthnicity,
      },
      {
        hairType: form.hairType.trim() || undefined,
        colorReference: form.colorReference.trim() || undefined,
      },
    );
    onClose();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-base-content">Nouvelle cliente</h2>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        <Card className="flex flex-col gap-4 p-5">
          <FieldLabel>Identité</FieldLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom" required>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Awa" />
            </Field>
            <Field label="Nom" required>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Sarr" />
            </Field>
            <Field label="Téléphone" required>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={(e) => setDuplicate(findDuplicate(e.target.value))}
                placeholder="+221 77 000 00 00"
              />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+221 77 000 00 00" />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="awa@example.com" />
            </Field>
            <Field label="Profession">
              <Input value={form.profession} onChange={(e) => set("profession", e.target.value)} />
            </Field>
            <Field label="Adresse">
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Pays de résidence" required>
              <Select value={form.residenceCountry} onChange={(v) => set("residenceCountry", v)} options={PAYS_OPTIONS} />
            </Field>
            <Field label="Ethnicité" required>
              <Select value={form.ethnicity} onChange={(v) => set("ethnicity", v)} options={ETHNICITY_OPTIONS} placeholder="Choisir…" />
            </Field>
            <Field label="Anniversaire" required>
              <BirthdaySelect value={birthday} onChange={setBirthday} />
            </Field>
            <Field label="Genre">
              <Select value={form.gender} onChange={(v) => set("gender", v as ClientGender)} options={GENDER_OPTIONS} />
            </Field>
            <Field label="Salon habituel">
              <Select
                value={salon}
                onChange={(v) => setSalon(v as SalonId)}
                options={salons.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Field>
          </div>

          {duplicate && (
            <Alert
              tone="warning"
              title="Ce numéro existe déjà"
              description={`${duplicate.name} utilise déjà ce numéro de téléphone. Deux clientes distinctes peuvent partager un même foyer — vous pouvez créer quand même.`}
              action={
                <Link href={`/clients/${duplicate.id}`} className="text-sm font-semibold underline underline-offset-2">
                  Voir la fiche existante
                </Link>
              }
            />
          )}
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <FieldLabel>Profil beauté</FieldLabel>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de cheveux">
              <Input value={form.hairType} onChange={(e) => set("hairType", e.target.value)} placeholder="Naturel, lisse, bouclé…" />
            </Field>
            <Field label="Référence couleur">
              <Input value={form.colorReference} onChange={(e) => set("colorReference", e.target.value)} />
            </Field>
          </div>
          <p className="text-xs text-base-content/45">
            Les préférences détaillées (onglerie, coiffure, spa, épilation, boisson) se renseignent ensuite sur la fiche.
          </p>
        </Card>

        {attempted && !canSubmit && (
          <Alert
            tone="error"
            title="Complétez les champs obligatoires"
            description="Prénom, nom, téléphone, e-mail, pays de résidence, ethnicité et anniversaire (jour et mois) sont nécessaires pour créer la fiche."
          />
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="brand" className="flex-1">
            {duplicate ? "Créer quand même" : "Créer"}
          </Button>
        </div>
      </form>
    </div>
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
  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton className="m-4 max-h-[90vh] max-w-md overflow-y-auto">
      {open && <EditCoordonneesForm initial={initial} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function EditCoordonneesForm({
  initial,
  onClose,
  onSave,
}: {
  initial: ClientCoordonnees;
  onClose: () => void;
  onSave: (patch: ClientCoordonnees) => void;
}) {
  const [phone, setPhone] = useState(initial.phone);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [residenceCountry, setResidenceCountry] = useState(initial.residenceCountry || PAYS_DEFAUT);
  const [profession, setProfession] = useState(initial.profession);
  const [ethnicity, setEthnicity] = useState<string>(initial.ethnicity);
  const [birthday, setBirthday] = useState(() => birthdayParts(initial.birthday));
  const birthdayValue = birthdayFromParts(birthday);
  const canSave = Boolean(phone.trim() && email.trim() && residenceCountry.trim() && ethnicity && birthdayValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      address: address.trim(),
      residenceCountry,
      profession: profession.trim(),
      ethnicity: ethnicity as ClientEthnicity,
      birthday: birthdayValue!,
    });
    onClose();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-base-content">Modifier les coordonnées</h2>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <Field label="Téléphone" required>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Adresse">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Pays de résidence" required>
          <Select value={residenceCountry} onChange={setResidenceCountry} options={PAYS_OPTIONS} />
        </Field>
        <Field label="Profession">
          <Input value={profession} onChange={(e) => setProfession(e.target.value)} />
        </Field>
        <Field label="Anniversaire" required>
          <BirthdaySelect value={birthday} onChange={setBirthday} />
        </Field>
        <Field label="Ethnicité" required>
          <Select value={ethnicity} onChange={setEthnicity} options={ETHNICITY_OPTIONS} placeholder="Choisir…" />
        </Field>
        <div className="mt-2 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="brand" className="flex-1" disabled={!canSave}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------ Préférences */

// Édition des préférences d'une cliente (2026-09-27), sur les questions
// définies dans Réglages › Préférences clientes. Les réponses modifiées sont
// enregistrées comme un nouveau passage daté (même modèle que « Noter la
// cliente » de point-de-vente : la fiche compte les passages et met en avant
// le dernier) ; la note libre, le type de cheveux et la réf. couleur sont
// remplacés tels quels.
export function EditPreferencesDialog({
  open,
  initial,
  questions,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: ClientPreferences;
  questions: PreferenceQuestion[];
  onClose: () => void;
  onSave: (prefs: ClientPreferences) => void;
}) {
  // Une rubrique = une catégorie du catalogue (ou les boissons) qui a des
  // questions actives, ou déjà une note libre sur cette fiche.
  const rubrics = PREFERENCE_RUBRICS.filter(
    (r) => questions.some((q) => q.active && rubricOf(q) === r.key) || initial.notes[r.key],
  );
  const [rubric, setRubric] = useState<string>(rubrics[0]?.key ?? "s-coiffure");
  const rubricLabel = rubrics.find((r) => r.key === rubric)?.label ?? "";
  const [choices, setChoices] = useState<Record<string, string[]>>(() => latestChoices(initial, questions));
  const [notes, setNotes] = useState(initial.notes);
  const [hairType, setHairType] = useState(initial.hairType ?? "");
  const [colorReference, setColorReference] = useState(initial.colorReference ?? "");
  const [opened, setOpened] = useState(open);

  if (open !== opened) {
    setOpened(open);
    if (open) {
      setChoices(latestChoices(initial, questions));
      setNotes(initial.notes);
      setHairType(initial.hairType ?? "");
      setColorReference(initial.colorReference ?? "");
    }
  }

  const toggle = (q: PreferenceQuestion, optionId: string) =>
    setChoices((c) => {
      const cur = c[q.id] ?? [];
      const on = cur.includes(optionId);
      const next = q.multiple ? (on ? cur.filter((x) => x !== optionId) : [...cur, optionId]) : on ? [] : [optionId];
      return { ...c, [q.id]: next };
    });

  const submit = () => {
    const before = latestChoices(initial, questions);
    const changed: Record<string, string[]> = {};
    for (const q of questions) {
      const a = [...(before[q.id] ?? [])].sort().join("|");
      const b = [...(choices[q.id] ?? [])].sort().join("|");
      if (a !== b && (choices[q.id]?.length ?? 0) > 0) changed[q.id] = choices[q.id];
    }
    const cleanNotes = Object.fromEntries(
      Object.entries(notes).map(([k, v]) => [k, v?.trim()]).filter(([, v]) => v),
    ) as ClientPreferences["notes"];
    onSave({
      notes: cleanNotes,
      rounds: Object.keys(changed).length
        ? [{ at: new Date().toISOString().slice(0, 10), choices: changed }, ...initial.rounds]
        : initial.rounds,
      hairType: hairType.trim() || undefined,
      colorReference: colorReference.trim() || undefined,
    });
    onClose();
  };

  const rubricQuestions = questions.filter((q) => q.active && rubricOf(q) === rubric);

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton={false} className="max-w-3xl m-4">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-base-content">Modifier les préférences</h3>
        <p className="mt-1 text-sm text-base-content/60">
          Les questions se règlent dans Réglages › Préférences clientes.
        </p>

        <SegmentedToggle
          className="mt-5 w-full"
          size="sm"
          aria-label="Catégorie"
          options={rubrics.map((r) => ({ value: r.key, label: r.label }))}
          value={rubric}
          onChange={setRubric}
        />

        <div className="mt-6 space-y-6">
          {rubric === "s-coiffure" && (
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Type de cheveux" value={hairType} onChange={setHairType} placeholder="Crépus, fins" />
              <TextInput label="Réf. couleur" value={colorReference} onChange={setColorReference} placeholder="1B" />
            </div>
          )}
          {rubricQuestions.length === 0 && (
            <p className="text-sm text-base-content/55">Aucune question active pour cette catégorie.</p>
          )}
          {rubricQuestions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-semibold text-base-content">{q.title}</p>
              <p className="text-xs text-base-content/55">{q.multiple ? "Plusieurs réponses possibles." : "Une seule réponse."}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {q.options.map((o) => {
                  const on = (choices[q.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(q, o.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-field border py-1.5 pr-3 text-sm font-medium transition",
                        o.photo ? "pl-1.5" : "pl-3",
                        on
                          ? "border-primary bg-accent text-secondary"
                          : "border-base-300 text-base-content/70 hover:bg-base-200",
                      )}
                    >
                      {o.photo && (
                        // eslint-disable-next-line @next/next/no-img-element -- photo locale ou dataURL de session
                        <img src={o.photo} alt="" className="size-7 rounded object-cover" />
                      )}
                      {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <Field label={`Note libre — ${rubricLabel}`}>
            <Textarea
              value={notes[rubric] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [rubric]: e.target.value }))}
              placeholder="Ce que l'équipe doit savoir pour cette catégorie"
            />
          </Field>
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
