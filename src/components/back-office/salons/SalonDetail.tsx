"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";
import {
  frShortDate,
  POSTE_TYPES,
  POSTE_TYPE_LABELS,
  type PosteType,
  type SalonClosure,
  type SalonConfig,
  type SalonId,
} from "@/lib/mock/beautyandco";
import { prestationSeeds, serviceSeeds } from "@/lib/mock/services";
import HoursEditor from "./HoursEditor";
import {
  BackButton,
  SectionCard,
  SettingRow,
  TextInput,
  Toggle,
  btnGhost,
  btnPrimary,
  posteCount,
} from "./ui";

type Props = {
  config: SalonConfig;
  closures: SalonClosure[];
  isLastActive: boolean;
  onChange: (next: SalonConfig) => void;
  onAddClosure: (c: SalonClosure) => void;
  onRemoveClosure: (id: string) => void;
  onBack: () => void;
};

export default function SalonDetail({
  config,
  closures,
  isLastActive,
  onChange,
  onAddClosure,
  onRemoveClosure,
  onBack,
}: Props) {
  const set = <K extends keyof SalonConfig>(key: K, value: SalonConfig[K]) =>
    onChange({ ...config, [key]: value });

  const setPoste = (type: PosteType, raw: string) => {
    const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
    onChange({
      ...config,
      postes: { ...config.postes, [type]: Number.isFinite(n) ? n : 0 },
    });
  };

  const blockedDeactivate = isLastActive && config.active;
  const salonClosures = closures.filter(
    (c) => c.scope === "all" || c.scope === config.id,
  );

  const proposedServices = serviceSeeds.filter((s) =>
    s.salonIds.includes(config.id as SalonId),
  );
  const prestationsHere = prestationSeeds.filter(
    (p) => p.serviceId && proposedServices.some((s) => s.id === p.serviceId),
  );
  const totalCategorised = prestationSeeds.filter((p) => p.serviceId).length;

  return (
    <div className="space-y-6">
      <div>
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-semibold text-gray-800">{config.name || "Salon"}</h1>
        <p className="mt-1 text-theme-sm text-gray-500">{config.address}</p>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* 1. Identité */}
        <SectionCard title="Identité">
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Nom" value={config.name} onChange={(v) => set("name", v)} />
            <TextInput label="Quartier" value={config.area} onChange={(v) => set("area", v)} />
            <TextInput label="Adresse" value={config.address} onChange={(v) => set("address", v)} />
            <TextInput label="Téléphone" value={config.phone} onChange={(v) => set("phone", v)} />
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <SettingRow
              title="Salon actif"
              description="Un salon inactif n'apparaît plus à la réservation et disparaît des filtres."
              control={
                <Toggle
                  checked={config.active}
                  disabled={blockedDeactivate}
                  onChange={(v) => set("active", v)}
                  aria-label="Salon actif"
                />
              }
            />
            {blockedDeactivate && (
              <p className="mt-2 text-theme-xs text-warning-600">
                Impossible de désactiver le dernier salon actif.
              </p>
            )}
          </div>
        </SectionCard>

        {/* 2. Postes de travail */}
        <SectionCard
          title="Postes de travail"
          description="Capacité comptée par type : un poste coiffure ne sert pas à une manucure."
        >
          <div className="grid grid-cols-3 gap-4">
            {POSTE_TYPES.map((t) => (
              <TextInput
                key={t}
                label={POSTE_TYPE_LABELS[t]}
                value={String(config.postes[t] ?? 0)}
                onChange={(v) => setPoste(t, v)}
                inputMode="numeric"
              />
            ))}
          </div>
          <p className="mt-4 text-theme-sm text-gray-500">
            Total : {posteCount(config)} poste{posteCount(config) > 1 ? "s" : ""}
          </p>
          {posteCount(config) === 0 && (
            <p className="mt-1 text-theme-xs text-warning-600">
              Aucune réservation possible tant qu&apos;aucun poste n&apos;est déclaré.
            </p>
          )}
        </SectionCard>

        {/* 3. Heures d'ouverture */}
        <SectionCard title="Heures d'ouverture">
          <HoursEditor hours={config.hours} onChange={(h) => set("hours", h)} />
        </SectionCard>

        {/* 4. Fermetures exceptionnelles */}
        <SectionCard
          title="Fermetures exceptionnelles"
          description="Congés, travaux, jours fériés. Les rendez-vous ne sont pas déplacés automatiquement."
        >
          <ClosureForm salonId={config.id} onAdd={onAddClosure} />

          {salonClosures.length === 0 ? (
            <p className="mt-4 text-theme-sm text-gray-500">Aucune fermeture programmée.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {salonClosures.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {frShortDate(c.from)}
                      {c.to !== c.from ? ` → ${frShortDate(c.to)}` : ""}
                    </p>
                    <p className="mt-0.5 text-theme-xs text-gray-500">
                      {c.reason} · {c.scope === "all" ? "Tous les salons" : "Ce salon"}
                    </p>
                  </div>
                  {c.scope === "all" ? (
                    <span className="text-theme-xs text-gray-400">Fermeture réseau</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemoveClosure(c.id)}
                      aria-label="Supprimer la fermeture"
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                    >
                      <TrashBinIcon className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-theme-xs text-gray-500">
            Vérifiez les rendez-vous de cette période dans{" "}
            <Link href="/rendez-vous" className="font-medium text-brand-600 hover:underline">
              Rendez-vous
            </Link>
            .
          </p>
        </SectionCard>

        {/* 5. Prestations proposées ici (miroir lecture seule) */}
        <SectionCard
          title="Prestations proposées ici"
          description="Reflet du catalogue. La composition se gère dans Services."
        >
          <p className="text-theme-sm text-gray-700">
            {prestationsHere.length} sur {totalCategorised} prestations proposées dans ce salon
            {proposedServices.length > 0 && (
              <span className="text-gray-400">
                {" "}
                · {proposedServices.length} catégorie{proposedServices.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
          {proposedServices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {proposedServices.map((s) => (
                <Badge key={s.id} size="sm" color="light">
                  {s.emoji} {s.name}
                </Badge>
              ))}
            </div>
          )}
          <Link
            href="/services"
            className="mt-4 inline-block text-theme-sm font-medium text-brand-600 hover:underline"
          >
            Gérer dans Services →
          </Link>
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ClosureForm({
  salonId,
  onAdd,
}: {
  salonId: string;
  onAdd: (c: SalonClosure) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [scopeAll, setScopeAll] = useState(false);

  const valid = from !== "" && to !== "" && to >= from && reason.trim() !== "";

  const submit = () => {
    if (!valid) return;
    onAdd({
      id: `cl-user-${Date.now().toString(36)}`,
      scope: scopeAll ? "all" : (salonId as SalonId),
      from,
      to,
      reason: reason.trim(),
    });
    setFrom("");
    setTo("");
    setReason("");
    setScopeAll(false);
  };

  const dateClass =
    "h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-theme-xs font-medium text-gray-600">
          Du
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`mt-1 block ${dateClass}`}
          />
        </label>
        <label className="text-theme-xs font-medium text-gray-600">
          Au
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`mt-1 block ${dateClass}`}
          />
        </label>
        <label className="flex-1 text-theme-xs font-medium text-gray-600">
          Motif
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Congés, travaux…"
            className={`mt-1 block w-full ${dateClass}`}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-theme-sm text-gray-600">
          <input
            type="checkbox"
            checked={scopeAll}
            onChange={(e) => setScopeAll(e.target.checked)}
            className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
          />
          Appliquer à tous les salons
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setFrom("");
              setTo("");
              setReason("");
              setScopeAll(false);
            }}
          >
            Effacer
          </button>
          <button type="button" className={btnPrimary} disabled={!valid} onClick={submit}>
            Ajouter
          </button>
        </div>
      </div>
      {from !== "" && to !== "" && to < from && (
        <p className="mt-2 text-theme-xs text-error-600">
          La date de fin doit suivre la date de début.
        </p>
      )}
    </div>
  );
}
