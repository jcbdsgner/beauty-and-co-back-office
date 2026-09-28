"use client";
import type React from "react";
import { useEffect, useRef } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// Menu déroulant maison (clic extérieur géré à la main) — habillage du
// `DropdownMenu` / `Popover` de point-de-vente depuis le 2026-09-27. Conservé
// plutôt que remplacé par Radix : deux consommateurs (PeriodFilter,
// JournalPeriodPicker) y montent un calendrier flatpickr attaché au <body>,
// qu'un popover Radix prendrait pour un clic extérieur.
export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !(event.target as HTMLElement).closest('.dropdown-toggle')
    ) {
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [onClose]);


  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40 right-0 mt-2 rounded-box border border-border bg-popover p-1.5 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );
};
