"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  labelledBy: string;
  role?: "dialog" | "alertdialog";
  /** "sheet" anchors to the bottom and shows a drag-handle grip — for a form that wants to feel
   *  like it slid up from the counter, not a floating alert. "side" anchors full-height to the
   *  right, over the page rather than in place of it — for a read view, not a form. */
  variant?: "center" | "sheet" | "side";
  /** Lets Échap / a click outside close it. Passing it opts that instance into being dismissible
   *  this way (any variant, back-office — see below); omit it and the dialog stays protected. */
  onClose?: () => void;
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Radix Dialog under the hood — real focus trap, scroll lock and portal, which the previous
 * hand-rolled overlay never had. Kept as a controlled, close-button-only surface: overlay clicks
 * and Escape do NOT dismiss it (USERFLOW.md § "aucun dialogue ne se ferme au clic sur l'overlay
 * ni à la touche Échap" — a deliberate decision on a counter where a stray tap must never wipe a
 * half-filled form). Every caller renders its own explicit "×" / "Annuler" control.
 *
 * "side" is the one exception: it carries a read view (a fiche, not a form), so nothing is lost
 * if it closes early — pass `onClose` and it dismisses on Échap / outside click like any ordinary
 * overlay (ADR 0023).
 *
 * Elevation: a deep, wide shadow + chunkier 28px corners so a Dialog never reads as a flat Card.
 */
export function Dialog({ open, labelledBy, role = "dialog", variant = "center", onClose, overlayClassName, className, children }: DialogProps) {
  const sheet = variant === "sheet";
  const side = variant === "side";
  // Écart back-office (2026-09-27) : point-de-vente ne rend fermable par Échap / clic extérieur
  // que la variante "side" (caisse tactile — un tap perdu ne doit pas effacer un formulaire).
  // Ici, poste desktop à la souris : toute variante qui reçoit `onClose` devient fermable, comme
  // les modales du back-office l'étaient déjà avant la reprise de ce composant.
  const dismissible = Boolean(onClose);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next && dismissible) onClose?.(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            overlayClassName,
          )}
        />
        <div
          className={cn(
            "fixed inset-0 z-50 flex",
            side ? "justify-end" : "items-center justify-center p-4",
            sheet && "items-end justify-center p-4 sm:items-center",
          )}
        >
          <DialogPrimitive.Content
            aria-labelledby={labelledBy}
            aria-describedby={undefined}
            role={role}
            onEscapeKeyDown={(e) => { if (!dismissible) e.preventDefault(); }}
            onPointerDownOutside={(e) => { if (!dismissible) e.preventDefault(); }}
            onInteractOutside={(e) => { if (!dismissible) e.preventDefault(); }}
            className={cn(
              "w-full bg-base-100 text-base-content shadow-[0px_24px_64px_-12px_rgba(0,0,0,0.35)] focus:outline-none",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              side
                ? "h-full max-w-md rounded-none data-[state=open]:slide-in-from-right-12 data-[state=closed]:slide-out-to-right-12"
                : "rounded-[var(--radius-box)] data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
              sheet && "rounded-t-[var(--radius-box)] sm:rounded-[var(--radius-box)]",
              className,
            )}
          >
            <VisuallyHidden>
              <DialogPrimitive.Title>Boîte de dialogue</DialogPrimitive.Title>
            </VisuallyHidden>
            {sheet && <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-base-300" />}
            {children}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
