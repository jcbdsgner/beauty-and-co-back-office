"use client";

import { ChevronRight, Lock, Plus } from "lucide-react";
import { type EmailTemplate } from "@/lib/mock/emails";
import { EmptyRow, SettingsGroup, btnOutline } from "../kit";

// Réglages › Emails › modèles : une ligne par email — nom, objet, moment
// d'envoi. Les modèles système (verrou) partent tout seuls et ne se suppriment
// pas ; un clic ouvre l'éditeur en panneau latéral.

function TemplateRow({ template, onEdit }: { template: EmailTemplate; onEdit: () => void }) {
  const system = template.kind === "system";
  return (
    <button
      type="button"
      onClick={onEdit}
      className="group grid w-full grid-cols-[minmax(0,1fr)_260px_20px] items-center gap-6 px-6 py-3.5 text-left transition-colors hover:bg-base-200/60 focus-visible:bg-base-200/60 focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[15px] font-medium text-base-content">
          <span className="truncate">{template.name}</span>
          {system ? (
            <Lock className="size-3.5 shrink-0 text-base-content/40" aria-label="Modèle système" />
          ) : (
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-secondary">
              Personnalisé
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-base-content/55">{template.subject}</span>
      </span>
      <span className="line-clamp-2 text-sm text-base-content/60">{template.trigger}</span>
      <ChevronRight
        className="size-4 text-base-content/35 transition-transform group-hover:translate-x-0.5 group-hover:text-base-content/60"
        aria-hidden
      />
    </button>
  );
}

export default function TemplateList({
  templates,
  onNew,
  onEdit,
}: {
  templates: EmailTemplate[];
  onNew: () => void;
  onEdit: (t: EmailTemplate) => void;
}) {
  const system = templates.filter((t) => t.kind === "system");
  const custom = templates.filter((t) => t.kind !== "system");
  return (
    <SettingsGroup
      title="Modèles d'email"
      description="Le texte de chaque email. Les modèles verrouillés partent automatiquement : leur texte se modifie, ils ne se suppriment pas."
      action={
        <button type="button" onClick={onNew} className={`${btnOutline} gap-1.5`}>
          <Plus className="size-4" aria-hidden />
          Nouveau modèle
        </button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)_260px_20px] gap-6 bg-base-200/60 px-6 py-2 text-xs font-medium text-base-content/55">
        <span>Email · objet</span>
        <span>Envoi</span>
        <span />
      </div>
      {[...system, ...custom].map((t) => (
        <TemplateRow key={t.id} template={t} onEdit={() => onEdit(t)} />
      ))}
      {custom.length === 0 && (
        <EmptyRow>Aucun modèle personnalisé : créez-en un pour une offre ou une relance.</EmptyRow>
      )}
    </SettingsGroup>
  );
}
