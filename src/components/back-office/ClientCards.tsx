"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/atoms/avatar";
import { TIER_TONE } from "@/components/ui/atoms/badge";
import { initialsOf } from "@/components/back-office/shared/PersonCard";
import { TIER_LABEL, fcfa, frShortDate, type ClientRow, type ClientTier } from "@/lib/mock/beautyandco";

// Bloc cliente du répertoire — repris de point-de-vente (`ClientCard`,
// `repertoire-view.tsx`), qui fait autorité : avatar, palier en drapeau,
// nom, « N visites · dernière visite », total dépensé. Tout le bloc mène à
// la fiche (panneau latéral). `trailing` remplace la ligne de visites et
// masque le total (blocs « Vues récemment » / « Attendues aujourd'hui »).

export function TierFlag({ tier }: { tier: ClientTier }) {
  if (!tier) return null;
  return (
    <span className={`rounded-sm px-2 py-0.5 text-xs font-bold uppercase tracking-[0.06em] ${TIER_TONE[tier]}`}>
      {TIER_LABEL[tier]}
    </span>
  );
}

export function ClientCard({ client: c, trailing }: { client: ClientRow; trailing?: string }) {
  const visits = `${c.appointments} visite${c.appointments > 1 ? "s" : ""}`;
  return (
    <Link
      href={`/clients/${c.id}`}
      className="group flex flex-col gap-3 rounded-lg bg-base-100 p-4 text-left shadow-[0px_30px_30px_0px_rgba(0,0,0,0.04),0px_7px_16px_0px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0px_30px_30px_0px_rgba(0,0,0,0.06),0px_7px_16px_0px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <Avatar initial={initialsOf(c.name)} size={40} className="bg-accent text-sm font-semibold text-secondary" />
        <TierFlag tier={c.tier} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-base-content">{c.name}</p>
        <p className="truncate text-xs text-base-content/55">
          {trailing ?? `${visits}${c.lastVisit ? ` · ${frShortDate(c.lastVisit)}` : ""}`}
        </p>
      </div>
      {!trailing && (
        <div className="mt-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/35">Total dépensé</p>
          <p className="text-sm font-semibold tabular-nums text-primary">{fcfa(c.totalSpent)}</p>
        </div>
      )}
    </Link>
  );
}

export default function ClientCards({ rows }: { rows: ClientRow[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {rows.map((c) => (
        <ClientCard key={c.id} client={c} />
      ))}
    </div>
  );
}
