"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckLineIcon, CloseLineIcon, LockIcon, TrashBinIcon } from "@/icons";
import {
  CUSTOM_TRIGGER,
  TEMPLATE_VARIABLES,
  templateKindLabel,
  type EmailTemplate,
} from "@/lib/mock/emails";
import { fieldClass, btnGhost, btnPrimary } from "./ui";

export type EditorTarget =
  | { mode: "new" }
  | { mode: "edit"; template: EmailTemplate };

// id interne uniquement (suffixé d'un timestamp) — pas besoin d'un slug parfait.
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function TemplateEditorPanel({
  target,
  onClose,
  onSave,
  onDelete,
}: {
  target: EditorTarget;
  onClose: () => void;
  onSave: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const existing = target.mode === "edit" ? target.template : null;
  const isSystem = existing?.kind === "system";

  const [name, setName] = useState(existing?.name ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const title = existing ? existing.name : "Nouveau modèle";

  const dirty = useMemo(() => {
    if (!existing) return name.trim() !== "" || subject.trim() !== "" || body.trim() !== "";
    return (
      name !== existing.name || subject !== existing.subject || body !== existing.body
    );
  }, [existing, name, subject, body]);

  const canSave = subject.trim() !== "" && body.trim() !== "" && (isSystem || name.trim() !== "") && dirty;

  const insertVariable = (token: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    if (existing) {
      onSave({ ...existing, name: isSystem ? existing.name : name.trim(), subject, body });
    } else {
      const base = slug(name) || "modele";
      onSave({
        id: `custom-${base}-${Date.now().toString(36)}`,
        name: name.trim(),
        kind: "custom",
        trigger: CUSTOM_TRIGGER,
        subject,
        body,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-gray-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-[560px] flex-col bg-white shadow-theme-lg"
      >
        {/* en-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-theme-xs font-medium text-gray-400">
              {existing ? "Modifier le modèle" : "Créer un modèle"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <CloseLineIcon className="size-5" />
          </button>
        </div>

        {/* corps défilant */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isSystem && (
            <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3 text-theme-xs text-gray-600">
              <LockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" />
              <span>
                Modèle {templateKindLabel("system").toLowerCase()} : vous pouvez adapter
                l&apos;objet et le texte, mais pas le renommer, le supprimer ni changer son
                déclencheur ({existing?.trigger.toLowerCase()}).
              </span>
            </div>
          )}

          <div>
            <label htmlFor="tpl-name" className="mb-1.5 block text-sm font-medium text-gray-800">
              Nom du modèle
            </label>
            <input
              id="tpl-name"
              type="text"
              value={isSystem ? existing!.name : name}
              disabled={isSystem}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Offre de bienvenue"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="tpl-subject" className="mb-1.5 block text-sm font-medium text-gray-800">
              Objet
            </label>
            <input
              id="tpl-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="tpl-body" className="mb-1.5 block text-sm font-medium text-gray-800">
              Corps du message
            </label>
            <textarea
              id="tpl-body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Texte de l'email…"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
            />
          </div>

          <div>
            <p className="mb-2 text-theme-xs font-medium text-gray-500">
              Variables disponibles — cliquez pour insérer dans le corps du message.
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => insertVariable(v.token)}
                  title={v.label}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-theme-xs text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                >
                  {v.token}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* pied */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <div>
            {existing && !isSystem && (
              confirmDelete ? (
                <span className="flex items-center gap-2 text-theme-xs">
                  <span className="text-gray-500">Supprimer&nbsp;?</span>
                  <button
                    type="button"
                    onClick={() => onDelete(existing.id)}
                    className="font-semibold text-error-600 hover:underline"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-medium text-gray-500 hover:underline"
                  >
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-theme-xs font-medium text-gray-500 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                  Supprimer
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={btnGhost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={btnPrimary}
            >
              <CheckLineIcon className="size-4" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
