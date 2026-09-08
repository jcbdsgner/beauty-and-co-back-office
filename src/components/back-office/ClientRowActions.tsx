"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreDotIcon } from "@/icons";

// Bouton « Détails » + menu ⋯ d'une ligne du tableau clients. Le menu est rendu
// dans un portail (position fixe) pour ne pas être rogné par le tableau.

type Props = {
  clientId: string;
  clientName: string;
  onDelete: () => void;
};

const MENU_WIDTH = 208;

export default function ClientRowActions({ clientId, clientName, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.right - MENU_WIDTH });
    }
    setOpen((o) => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Autres actions pour ${clientName}`}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 ${
          open ? "bg-gray-50 text-gray-700" : ""
        }`}
      >
        <MoreDotIcon className="h-5 w-5" />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-50 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg"
          >
            <Link
              href={`/clients/${clientId}#rendez-vous`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-theme-sm text-gray-700 hover:bg-gray-50"
            >
              Voir les rendez-vous
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="block w-full px-4 py-2 text-left text-theme-sm text-error-600 hover:bg-error-50"
            >
              Supprimer
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
