"use client";

import { LockIcon, PencilIcon, PlusIcon } from "@/icons";
import {
  templateKindLabel,
  type EmailTemplate,
} from "@/lib/mock/emails";
import { btnPrimary } from "./ui";

function KindBadge({ kind }: { kind: EmailTemplate["kind"] }) {
  if (kind === "system") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-600">
        <LockIcon className="size-3" />
        {templateKindLabel(kind)}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600">
      {templateKindLabel(kind)}
    </span>
  );
}

function TemplateCard({
  template,
  onEdit,
}: {
  template: EmailTemplate;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="group flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-300 hover:shadow-theme-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800">{template.name}</h3>
        <KindBadge kind={template.kind} />
      </div>
      <p className="text-theme-xs text-gray-500">
        <span className="text-gray-400">Objet : </span>
        {template.subject}
      </p>
      <p className="line-clamp-2 whitespace-pre-line text-theme-xs text-gray-400">
        {template.body}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-gray-100 pt-2.5">
        <span className="text-theme-xs text-gray-400">{template.trigger}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-theme-xs font-medium text-gray-400 transition group-hover:text-brand-600">
          <PencilIcon className="size-3.5" />
          Modifier
        </span>
      </div>
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
  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Modèles{" "}
            <span className="text-sm font-normal text-gray-400">({templates.length})</span>
          </h2>
          <p className="mt-1 text-theme-sm text-gray-500">
            Le texte de chaque email. Les modèles « Système » partent automatiquement ; ils
            s&apos;adaptent mais ne se suppriment pas.
          </p>
        </div>
        <button type="button" onClick={onNew} className={btnPrimary}>
          <PlusIcon className="size-4" />
          Nouveau modèle
        </button>
      </div>

      <div className="p-6">
        {templates.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-theme-sm text-gray-500">
            Aucun modèle. Créez-en un avec « Nouveau modèle ».
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onEdit={() => onEdit(t)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
