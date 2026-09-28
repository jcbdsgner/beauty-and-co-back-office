"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
  /** An inline "Annuler"-style undo action — pressing it fires onClick then dismisses immediately. When set, the toast lingers longer (5.5s) so there's real time to act on it. */
  action?: ToastAction;
};

/**
 * Lightweight confirmation banner for actions that don't otherwise show visible feedback
 * (+ Reappro, Preparer, Annuler, Envoyer au salon, Nouveau rendez-vous…). Auto-dismisses; no
 * entrance/exit motion beyond a plain opacity fade so it doesn't read as decorative animation.
 */
export function Toast({ message, onDismiss, action }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, action ? 5500 : 3200);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, action]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 transition-opacity duration-200",
        message ? "opacity-100" : "opacity-0",
      )}
    >
      {message && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-box bg-neutral py-2 pr-2 pl-5 text-[15px] font-medium text-neutral-content shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.4)]">
          <span>{message}</span>
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onDismiss();
              }}
              className="min-h-12 rounded-field bg-white/10 px-4 font-semibold text-white transition active:scale-95 active:bg-white/20 hover:bg-white/20"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
