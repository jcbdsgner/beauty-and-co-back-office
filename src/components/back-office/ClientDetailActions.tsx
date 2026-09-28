"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashBinIcon } from "@/icons";

// Action « Supprimer » de la fiche cliente — seule action destructive du
// panneau, volontairement discrète (texte, pas un bouton plein) pour ne pas
// concurrencer le CTA primaire « Nouveau rendez-vous » de la refonte
// 2026-09-21 (voir ClientDetailModal). Confirmation en ligne, aucune vraie
// suppression n'a lieu (aucune persistance dans ce projet).

type Props = {
  clientName: string;
  noun: string; // « cliente » / « client », accordé au genre
};

export default function ClientDetailActions({ clientName, noun }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-base-content/60">
          Supprimer <span className="font-medium text-base-content/80">{clientName}</span> ?
        </span>
        <button
          type="button"
          onClick={() => router.push("/clients")}
          className="font-semibold text-error-600 hover:underline"
        >
          Confirmer
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="font-medium text-base-content/60 hover:underline"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-base-content/45 transition-colors hover:text-error-600"
    >
      <TrashBinIcon className="h-3.5 w-3.5" />
      Supprimer {noun === "client" ? "le client" : "la cliente"}
    </button>
  );
}
