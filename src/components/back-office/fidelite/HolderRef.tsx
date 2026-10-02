"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { clientNumberLabel, type ClientRow } from "@/lib/mock/beautyandco";
import { contactName, type Contact } from "@/lib/mock/abonnements";

// Titulaire d'un abonnement / d'un pack, partagé par les deux suivis de
// /fidelite : nom + n° client cliquables vers la fiche (panneau latéral, route
// interceptée — on reste sur Fidélité derrière), et un lien « Voir la fiche »
// explicite à droite de la ligne. Une personne saisie hors fichier n'a pas de
// fiche : mention « Hors fichier », pas de lien.

export function HolderName({ row, contact }: { row: ClientRow | null; contact: Contact }) {
  if (!row) {
    return (
      <span className="inline-flex items-baseline gap-2">
        <span className="text-[16px] font-semibold text-base-content">{contactName(contact)}</span>
        <span className="text-sm text-base-content/50">Hors fichier</span>
      </span>
    );
  }
  return (
    <Link
      href={`/clients/${row.id}`}
      className="group inline-flex items-baseline gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdcfca]"
    >
      <span className="text-[16px] font-semibold text-base-content underline-offset-4 group-hover:underline">
        {contactName(contact)}
      </span>
      <span className="text-sm font-medium tabular-nums text-base-content/55">
        {clientNumberLabel(row.number)}
      </span>
    </Link>
  );
}

export function HolderFicheLink({ row }: { row: ClientRow | null }) {
  if (!row) return null;
  return (
    <Link
      href={`/clients/${row.id}`}
      className="btn btn-ghost btn-sm -mr-2 shrink-0 gap-1 normal-case text-[15px] font-semibold text-secondary"
    >
      Voir la fiche
      <ArrowUpRight aria-hidden className="size-4" />
    </Link>
  );
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digitsOf = (s: string) => s.replace(/\D/g, "");

/**
 * Recherche de l'écran : nom (souscripteur, bénéficiaire), n° client,
 * téléphone, nom du forfait / pack. Sans accent ni casse.
 */
export function holderMatches(
  query: string,
  { row, contacts, labels }: { row: ClientRow | null; contacts: Contact[]; labels: string[] },
) {
  const q = fold(query.trim());
  if (!q) return true;
  const text = [...contacts.map(contactName), ...labels].map(fold);
  if (text.some((t) => t.includes(q))) return true;
  const qDigits = digitsOf(q);
  if (qDigits.length < 2 || qDigits.length !== q.replace(/[\s.°n]/g, "").length) return false;
  const numbers = [
    row ? String(row.number) : "",
    row?.phone ?? "",
    ...contacts.map((c) => c.phone),
  ].map(digitsOf);
  return numbers.some((n) => n.includes(qDigits));
}
