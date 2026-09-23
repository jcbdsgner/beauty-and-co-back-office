// Données fictives — paramètres de paiement Beauty & Co. Front-end uniquement,
// aucune API, aucune persistance : l'onglet Paiement de l'écran /reglages édite
// ces valeurs en mémoire de session. Volontairement indépendant du barrel
// `@/lib/mock` : importer directement ce fichier (`@/lib/mock/paiement`).

import { fcfa } from "./beautyandco";

export type DepositMode = "fixed" | "percent" | "none";

export type PaymentSettings = {
  liveMode: boolean; // true = encaissement réel · false = mode test (aucun débit)
  depositMode: DepositMode; // acompte demandé à la réservation
  depositFixed: number; // montant fixe en FCFA (mode « fixed »)
  depositPercent: number; // part du total en % (mode « percent »)
  waveEnabled: boolean; // acompte réglable par Wave en plus des espèces/carte
  orangeMoneyEnabled: boolean; // acompte réglable par Orange Money
};

export const DEPOSIT_MODE_OPTIONS: { value: DepositMode; label: string }[] = [
  { value: "fixed", label: "Montant fixe" },
  { value: "percent", label: "Pourcentage du total" },
  { value: "none", label: "Aucun acompte" },
];

// Plancher imposé par le prestataire d'encaissement.
export const DEPOSIT_MIN_FCFA = 100;

// Wave et Orange Money remplacent l'ancien réglage PayPal (2026-09-22) : les
// deux seuls modes de paiement mobile réellement utilisés au comptoir côté
// point-de-vente (`lib/data/types.ts::PaymentMode`), en FCFA natif — pas de
// conversion de devise à afficher, contrairement à PayPal qui n'existait dans
// aucun des deux projets.
export const defaultPaymentSettings: PaymentSettings = {
  liveMode: true,
  depositMode: "fixed",
  depositFixed: 5000,
  depositPercent: 30,
  waveEnabled: true,
  orangeMoneyEnabled: true,
};

// Phrase de récapitulatif de la règle d'acompte active.
export const depositSummary = (s: PaymentSettings): string => {
  if (s.depositMode === "none") {
    return "Aucun acompte n'est demandé au moment de réserver.";
  }
  if (s.depositMode === "percent") {
    return `${s.depositPercent} % du total de la prestation sont demandés au moment de réserver.`;
  }
  return `${fcfa(s.depositFixed)} sont demandés au moment de réserver, quelle que soit la prestation.`;
};
