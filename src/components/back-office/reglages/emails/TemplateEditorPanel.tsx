"use client";

import { Dialog } from "@/components/ui/molecules/dialog";
import { useMemo, useRef, useState } from "react";
import { CheckLineIcon, CloseLineIcon, LockIcon, TrashBinIcon } from "@/icons";
import { Zap } from "lucide-react";
import {
  DEFAULT_SEND,
  TEMPLATE_VARIABLES,
  type EmailSend,
  type EmailTemplate,
} from "@/lib/mock/emails";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import EmailPreview from "../../shared/EmailPreview";
import { fieldClass, btnGhost, btnPrimary } from "./ui";
import SendSettings from "./SendSettings";

// Valeurs d'exemple de l'aperçu : une cliente et un rendez-vous plausibles,
// pour relire le modèle tel qu'il arrivera (le lien du site vient des réglages).
const SAMPLE_VALUES: Record<string, string> = {
  cliente: "Awa Sarr",
  salon: "Almadies",
  date: "jeudi 8 octobre",
  heure: "15:00",
  prestation: "Silk Press",
  praticienne: "Fatou",
};

type PreviewMode = "exemple" | "variables";

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
  siteLink,
  onClose,
  onSave,
  onDelete,
}: {
  target: EditorTarget;
  siteLink: string;
  onClose: () => void;
  onSave: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const existing = target.mode === "edit" ? target.template : null;
  const isSystem = existing?.kind === "system";

  const [name, setName] = useState(existing?.name ?? "");
  const [subject, setSubject] = useState(existing?.subject ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [send, setSend] = useState<EmailSend>(existing?.send ?? DEFAULT_SEND);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("exemple");
  const sampleValues = useMemo(() => ({ ...SAMPLE_VALUES, lien_site: siteLink }), [siteLink]);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Échap, clic sur le fond et verrou de défilement : portés par le `Dialog` Radix.

  const title = existing ? existing.name : "Nouveau modèle";

  const dirty = useMemo(() => {
    if (!existing) return name.trim() !== "" || subject.trim() !== "" || body.trim() !== "";
    return (
      name !== existing.name ||
      subject !== existing.subject ||
      body !== existing.body ||
      JSON.stringify(send) !== JSON.stringify(existing.send)
    );
  }, [existing, name, subject, body, send]);

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
      onSave({ ...existing, name: isSystem ? existing.name : name.trim(), subject, body, send });
    } else {
      const base = slug(name) || "modele";
      onSave({
        id: `custom-${base}-${Date.now().toString(36)}`,
        name: name.trim(),
        kind: "custom",
        send,
        subject,
        body,
      });
    }
  };

  return (
    <Dialog
      open
      variant="side"
      onClose={onClose}
      labelledBy="template-editor-title"
      className="relative flex h-full max-w-[1160px] flex-col"
    >
        {/* en-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-base-300 px-6 py-5">
          <div className="min-w-0">
            <h2 id="template-editor-title" className="truncate text-lg font-semibold text-base-content">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 rounded-lg p-1.5 text-base-content/45 transition hover:bg-base-200 hover:text-base-content/80"
          >
            <CloseLineIcon className="size-5" />
          </button>
        </div>

        {/* corps : formulaire à gauche, aperçu à droite, chacun défile seul */}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
          {isSystem && (
            <div className="flex items-start gap-2.5 rounded-xl bg-base-200 px-4 py-3 text-xs text-base-content/70">
              <LockIcon className="mt-0.5 size-4 shrink-0 text-base-content/45" />
              <span>
                Modèle système : vous pouvez adapter l&apos;objet et le texte, mais pas le
                renommer ni le supprimer.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="tpl-name" className="mb-1.5 block text-sm font-medium text-base-content">
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

          {existing?.fixedTrigger ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-base-content">Envoi</p>
              <div className="flex items-start gap-2.5 rounded-box border border-base-300 bg-base-200/50 px-4 py-3">
                <Zap className="mt-[3px] size-4 shrink-0 text-primary" aria-label="Automatique" />
                <div>
                  <p className="text-sm font-medium text-base-content">{existing.fixedTrigger}</p>
                  <p className="mt-0.5 text-xs text-base-content/60">
                    Lié à cette action, ce moment d&apos;envoi ne se modifie pas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <SendSettings send={send} onChange={setSend} />
          )}

          <div className="-mx-6 border-t border-base-300" />

          <div>
            <label htmlFor="tpl-subject" className="mb-1.5 block text-sm font-medium text-base-content">
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
            <label htmlFor="tpl-body" className="mb-1.5 block text-sm font-medium text-base-content">
              Corps du message
            </label>
            <textarea
              id="tpl-body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Texte de l'email…"
              className="w-full rounded-field border border-base-300 bg-white px-4 py-3 text-sm leading-relaxed text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-base-content/60">
              Variables disponibles — cliquez pour insérer dans le corps du message.
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => insertVariable(v.token)}
                  title={v.label}
                  className="rounded-lg border border-base-300 bg-base-200 px-2.5 py-1 font-mono text-xs text-base-content/70 transition hover:border-brand-300 hover:bg-accent hover:text-brand-600"
                >
                  {v.token}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section aria-label="Aperçu" className="flex min-h-0 flex-col border-l border-base-300 bg-base-200/60">
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
            <div>
              <p className="text-sm font-medium text-base-content">Aperçu</p>
              <p className="mt-0.5 text-xs text-base-content/60">
                {previewMode === "exemple"
                  ? "Ce que recevra une cliente — les informations remplacées sont surlignées."
                  : "Les variables restent visibles, à l'endroit où elles seront remplacées."}
              </p>
            </div>
            <SegmentedToggle
              size="sm"
              aria-label="Affichage de l'aperçu"
              className="w-56 shrink-0"
              options={[
                { value: "exemple", label: "Exemple" },
                { value: "variables", label: "Variables" },
              ]}
              value={previewMode}
              onChange={(v) => setPreviewMode(v as PreviewMode)}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <EmailPreview
              subject={subject}
              body={body}
              siteLink={siteLink}
              lineBreaks
              variables={previewMode === "exemple" ? sampleValues : {}}
            />
          </div>
        </section>
        </div>

        {/* pied */}
        <div className="flex items-center justify-between gap-3 border-t border-base-300 px-6 py-4">
          <div>
            {existing && !isSystem && (
              confirmDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-base-content/60">Supprimer&nbsp;?</span>
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
                    className="font-medium text-base-content/60 hover:underline"
                  >
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-base-content/60 transition hover:bg-error-50 hover:text-error-600"
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
    </Dialog>
  );
}
