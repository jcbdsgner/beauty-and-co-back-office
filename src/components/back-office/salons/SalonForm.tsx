"use client";

import { useState } from "react";
import {
  POSTE_TYPES,
  POSTE_TYPE_LABELS,
  SALON_CITY_OPTIONS,
  WEEKDAYS,
  type DayOpening,
  type PosteType,
  type SalonCity,
  type SalonConfig,
  type SalonId,
  type Weekday,
} from "@/lib/mock/beautyandco";
import HoursEditor, { hoursHaveError } from "./HoursEditor";
import {
  BackButton,
  SectionCard,
  SelectField,
  TextInput,
  btnGhost,
  btnPrimary,
} from "./ui";

const defaultHours = (): Record<Weekday, DayOpening> => {
  const open: DayOpening = {
    closed: false,
    open: "10:00",
    close: "20:00",
  };
  return WEEKDAYS.reduce(
    (acc, w) => ({ ...acc, [w]: w === "lun" ? { closed: true } : open }),
    {} as Record<Weekday, DayOpening>,
  );
};

export default function SalonForm({
  onCreate,
  onCancel,
}: {
  onCreate: (config: SalonConfig) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState<SalonCity>("Dakar");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [postes, setPostes] = useState<Record<PosteType, number>>({
    coiffure: 1,
    esthetique: 1,
    onglerie: 1,
  });
  const [hours, setHours] = useState<Record<Weekday, DayOpening>>(defaultHours);

  const valid = name.trim() !== "" && address.trim() !== "" && !hoursHaveError(hours);

  const submit = () => {
    if (!valid) return;
    const id = `salon-${Date.now().toString(36)}` as SalonId;
    onCreate({
      id,
      name: name.trim(),
      city,
      address: address.trim(),
      phone: phone.trim(),
      active: true,
      postes,
      hours,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onCancel} />
        <h3 className="text-xl font-semibold text-base-content">Nouveau salon</h3>
        <p className="mt-1 text-sm text-base-content/60">
          Renseignez l&apos;identité, la capacité et les horaires. Les prestations se
          rattacheront ensuite depuis Services.
        </p>
      </div>

      <div className="max-w-3xl space-y-5">
        <SectionCard title="Identité">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Nom" value={name} onChange={setName} placeholder="Ex. Plateau" />
            <SelectField label="Ville" value={city} onChange={setCity} options={SALON_CITY_OPTIONS} />
            <TextInput label="Adresse" value={address} onChange={setAddress} />
            <TextInput label="Téléphone" value={phone} onChange={setPhone} placeholder="+221 …" />
          </div>
        </SectionCard>

        <SectionCard
          title="Postes de travail"
          description="Capacité comptée par type. Modifiable plus tard."
        >
          <div className="grid grid-cols-3 gap-4">
            {POSTE_TYPES.map((t) => (
              <TextInput
                key={t}
                label={POSTE_TYPE_LABELS[t]}
                value={String(postes[t])}
                onChange={(v) => {
                  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
                  setPostes((p) => ({ ...p, [t]: Number.isFinite(n) ? n : 0 }));
                }}
                inputMode="numeric"
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Heures d'ouverture">
          <HoursEditor hours={hours} onChange={setHours} />
        </SectionCard>

        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={!valid} onClick={submit}>
            Créer le salon
          </button>
        </div>
      </div>
    </div>
  );
}
