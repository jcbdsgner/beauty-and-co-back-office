"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Les deux actions de l'en-tête de la fiche cliente.
// « Historique complet » descend simplement vers la section d'historique de la
// même page (pas de vue dédiée — squelette front-end).
// « Supprimer » demande une confirmation en ligne puis renvoie vers la liste ;
// aucune vraie suppression n'a lieu (aucune persistance dans ce projet).

type Props = {
  clientName: string;
  noun: string; // « cliente » / « client », accordé au genre
};

export default function ClientDetailActions({ clientName, noun }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-theme-sm text-gray-600">
          Supprimer la fiche de{" "}
          <span className="font-medium text-gray-800">{clientName}</span> ?
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-theme-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => router.push("/clients")}
            className="rounded-lg bg-error-500 px-3 py-2 text-theme-sm font-medium text-white hover:bg-error-600"
          >
            Supprimer définitivement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href="#historique"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Historique complet
      </a>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-error-200 px-4 py-2.5 text-theme-sm font-medium text-error-600 hover:bg-error-50"
      >
        Supprimer {noun === "client" ? "le client" : "la cliente"}
      </button>
    </div>
  );
}
