import { AlertTriangle, HelpCircle, Send } from "lucide-react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { Button, type ButtonVariant } from "@/components/ui/atoms/button";
import { cn } from "@/lib/utils";

type Tone = "danger" | "neutral" | "success";

const TONE: Record<Tone, { icon: typeof AlertTriangle; iconClass: string; defaultConfirmVariant: ButtonVariant }> = {
  danger: { icon: AlertTriangle, iconClass: "bg-error/10 text-error", defaultConfirmVariant: "danger" },
  neutral: { icon: HelpCircle, iconClass: "bg-base-200 text-base-content/70", defaultConfirmVariant: "dark" },
  success: { icon: Send, iconClass: "bg-primary/10 text-primary", defaultConfirmVariant: "brand" },
};

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  /** danger (annuler un rendez-vous, supprimer) / neutral (fermer un onglet) / success (valider &
   *  envoyer) — USERFLOW.md's "un seul patron de confirmation" covers more than destructive
   *  actions, so the icon and default button color now follow what's actually being confirmed
   *  instead of a permanent red warning triangle regardless of context. */
  tone?: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  tone = "danger",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  confirmVariant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { icon: Icon, iconClass, defaultConfirmVariant } = TONE[tone];

  return (
    <Dialog open={open} labelledBy="confirm-dialog-title" role="alertdialog" className="max-w-sm p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className={cn("flex size-12 items-center justify-center rounded-full", iconClass)}>
          <Icon aria-hidden className="size-6" />
        </span>
        <h2 id="confirm-dialog-title" className="font-[family-name:var(--font-heading)] font-semibold text-lg text-base-content">
          {title}
        </h2>
        {description && <p className="text-sm text-base-content/60">{description}</p>}
      </div>
      <div className="mt-6 flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {cancelLabel}
        </Button>
        <Button type="button" variant={confirmVariant ?? defaultConfirmVariant} onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
