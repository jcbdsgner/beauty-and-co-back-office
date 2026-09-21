"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/icons";
import type { SalonId } from "@/lib/mock/beautyandco";
import { SERVICE_ICON_OPTIONS, serviceSalons, type Service } from "@/lib/mock/services";
import { SERVICE_ICONS } from "./serviceIcons";
import { SectionCard, TextInput, Toggle, btnGhost, btnPrimary } from "./ui";

export type ServiceDraft = Omit<Service, "id">;

const BLANK: ServiceDraft = {
  name: "",
  icon: SERVICE_ICON_OPTIONS[0].value,
  description: "",
  active: true,
  salonIds: [],
};

type Props = {
  mode: "create" | "edit";
  service?: Service;
  onSubmit: (data: ServiceDraft) => void;
  onCancel?: () => void;
};

export default function ServiceInfoForm({ mode, service, onSubmit, onCancel }: Props) {
  const initial: ServiceDraft = service
    ? {
        name: service.name,
        icon: service.icon,
        description: service.description,
        active: service.active,
        salonIds: service.salonIds,
      }
    : BLANK;

  const [draft, setDraft] = useState<ServiceDraft>(initial);
  const [justSaved, setJustSaved] = useState(false);

  const set = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setJustSaved(false);
  };

  const toggleSalon = (id: SalonId) =>
    set(
      "salonIds",
      draft.salonIds.includes(id)
        ? draft.salonIds.filter((x) => x !== id)
        : [...draft.salonIds, id],
    );

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const valid = draft.name.trim().length > 0;
  const canSubmit = valid && (mode === "create" || dirty);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ ...draft, name: draft.name.trim(), description: draft.description.trim() });
    if (mode === "edit") setJustSaved(true);
  };

  return (
    <SectionCard
      title="Informations"
      description="Ce que la cliente voit au moment de choisir un service à la réservation."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <TextInput
            label="Nom du service"
            placeholder="Coiffure"
            value={draft.name}
            onChange={(v) => set("name", v)}
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-800">Vignette</span>
            <div className="flex flex-wrap gap-1">
              {SERVICE_ICON_OPTIONS.map((o) => {
                const Icon = SERVICE_ICONS[o.value];
                const on = draft.icon === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set("icon", o.value)}
                    aria-label={`Choisir la vignette ${o.label}`}
                    aria-pressed={on}
                    title={o.label}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                      on
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="service-description"
            className="mb-1.5 block text-sm font-medium text-gray-800"
          >
            Description
          </label>
          <textarea
            id="service-description"
            rows={2}
            value={draft.description}
            placeholder="Coupes, brushings, tresses, tissages et colorations."
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-gray-800">Proposé dans</span>
          <div className="flex flex-wrap gap-2">
            {serviceSalons.map((s) => {
              const on = draft.salonIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSalon(s.id)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-theme-sm font-medium transition ${
                    on
                      ? "border-brand-400 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      on ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300"
                    }`}
                  >
                    {on && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>
          {draft.salonIds.length === 0 && (
            <p className="mt-2 text-theme-xs text-warning-600">
              Sans salon, ce service ne sera proposé nulle part à la réservation.
            </p>
          )}
        </div>

        <div className="flex items-start justify-between gap-6 border-t border-gray-100 pt-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">Service actif</p>
            <p className="mt-0.5 text-theme-xs text-gray-500">
              Un service inactif reste paramétrable mais n&apos;apparaît pas à la réservation.
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <Toggle
              checked={draft.active}
              onChange={(v) => set("active", v)}
              aria-label="Service actif"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={submit} disabled={!canSubmit} className={btnPrimary}>
          {mode === "create" ? "Créer le service" : "Enregistrer"}
        </button>
        {mode === "create" && onCancel && (
          <button type="button" onClick={onCancel} className={btnGhost}>
            Annuler
          </button>
        )}
        {mode === "edit" && justSaved && !dirty && (
          <span className="inline-flex items-center gap-1.5 text-theme-sm font-medium text-success-600">
            <CheckCircleIcon className="size-4" />
            Enregistré
          </span>
        )}
      </div>
    </SectionCard>
  );
}
