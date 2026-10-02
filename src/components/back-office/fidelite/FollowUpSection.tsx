"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Pièces communes aux deux suivis de /fidelite : la liste repliable des
// éléments clos (abonnements révoqués, packs entièrement utilisés) et l'état
// « rien ne correspond à la recherche ».

export function FollowUpSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Une recherche qui trouve un élément clos le déplie d'office.
  const [lastDefault, setLastDefault] = useState(defaultOpen);
  if (defaultOpen !== lastDefault) {
    setLastDefault(defaultOpen);
    if (defaultOpen) setOpen(true);
  }

  return (
    <section className="mt-5 border-t border-base-300 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-field py-1 text-left text-[15px] font-medium text-base-content/70 hover:text-base-content"
      >
        <span>
          {title} <span className="tabular-nums text-base-content/50">({count})</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <ul className="mt-1 divide-y divide-base-300">{children}</ul>}
    </section>
  );
}

export function NoMatch({
  query,
  what,
  onClear,
}: {
  query: string;
  what: string;
  onClear: () => void;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-[15px] text-base-content/70">
        Aucun {what} pour «&nbsp;{query.trim()}&nbsp;».
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm font-semibold text-secondary underline-offset-4 hover:underline"
      >
        Effacer la recherche
      </button>
    </div>
  );
}
