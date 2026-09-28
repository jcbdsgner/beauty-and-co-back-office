"use client";
import React, { useId } from "react";
import { Dialog } from "@/components/ui/molecules/dialog";
import { CloseButton } from "@/components/ui/atoms/icon-button";
import { cn } from "@/lib/utils";

// Enveloppe historique (`isOpen` / `onClose` / `showCloseButton`) conservée pour
// ses consommateurs — le rendu est désormais le `Dialog` Radix de
// point-de-vente (vrai piège de focus, verrou de défilement, portail). Fermable
// par Échap / clic extérieur, comme avant. À préférer directement dans le
// nouveau code : `@/components/ui/molecules/dialog`.
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
}) => {
  const labelId = useId();
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      labelledBy={labelId}
      className={cn(
        "relative max-h-[calc(100vh-2rem)] overflow-y-auto",
        isFullscreen && "h-full max-w-none rounded-none",
  className,
      )}
      >
      {showCloseButton && <CloseButton onClick={onClose} className="z-10" />}
        {children}
    </Dialog>
  );
};
