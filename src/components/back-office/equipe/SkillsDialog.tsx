"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { Dialog } from "@/components/ui/molecules/dialog";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { cn } from "@/lib/utils";
import {
  durationLabel,
  fcfa,
  prestationSeeds,
  serviceSeeds,
  type Prestation,
} from "@/lib/mock/services";
import type { Member } from "@/lib/mock/staff";

// Fenêtre de modification des compétences d'un membre : grande, avec une
// recherche sur tout le catalogue (107 prestations) et un sommaire des
// catégories à gauche. Brouillon local — rien n'est écrit tant qu'on
// n'a pas cliqué « Enregistrer ».

export type SkillGroup = {
  id: string;
  label: string;
  prestations: Prestation[];
};

// Prestations regroupées par catégorie, dans l'ordre du catalogue ;
// « Sans catégorie » en dernier.
export const SKILL_GROUPS: SkillGroup[] = [
  ...serviceSeeds.map((s) => ({
    id: s.id,
    label: s.name,
    prestations: prestationSeeds.filter((p) => p.serviceId === s.id),
  })),
  {
    id: "orphelines",
    label: "Sans catégorie",
    prestations: prestationSeeds.filter((p) => p.serviceId === null),
  },
].filter((g) => g.prestations.length > 0);

export const SKILL_TOTAL = prestationSeeds.length;

const SUBCATEGORY_NAME = new Map(
  serviceSeeds.flatMap((s) => s.subcategories.map((sc) => [sc.id, sc.name] as const)),
);

// Prestations (parmi `skills`) que ce membre est la seule praticienne active
// à savoir réaliser.
export function soleProviderIds(member: Member, allMembers: Member[], skills: string[]): Set<string> {
  const others = allMembers.filter(
    (m) => m.id !== member.id && m.active && m.roles.includes("praticienne"),
  );
  return new Set(skills.filter((id) => !others.some((m) => m.skills.includes(id))));
}

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Props = {
  open: boolean;
  member: Member;
  allMembers: Member[];
  onClose: () => void;
  onSave: (skills: string[]) => void;
};

export default function SkillsDialog({ open, member, allMembers, onClose, onSave }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="skills-dialog-title"
      className="flex h-[86vh] max-w-5xl flex-col overflow-hidden"
    >
      {/* Remonté à chaque ouverture : le brouillon repart des compétences actuelles. */}
      {open && (
        <SkillsEditor member={member} allMembers={allMembers} onClose={onClose} onSave={onSave} />
      )}
    </Dialog>
  );
}

function SkillsEditor({ member, allMembers, onClose, onSave }: Omit<Props, "open">) {
  const [draft, setDraft] = useState(() => new Set(member.skills));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const listRef = useRef<HTMLDivElement>(null);

  // Revenir en haut de la liste quand on change de catégorie ou de recherche.
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [category, query]);

  const q = fold(query.trim());
  const searching = q.length > 0;

  // La recherche porte sur tout le catalogue (elle ignore la catégorie choisie).
  const visible = useMemo(
    () =>
      SKILL_GROUPS.filter((g) => searching || category === "all" || g.id === category)
        .map((g) => ({
          ...g,
          prestations: searching
            ? g.prestations.filter(
                (p) =>
                  fold(p.name).includes(q) ||
                  fold(SUBCATEGORY_NAME.get(p.subcategoryId ?? "") ?? "").includes(q),
              )
            : g.prestations,
        }))
        .filter((g) => g.prestations.length > 0),
    [category, q, searching],
  );
  const visibleCount = visible.reduce((n, g) => n + g.prestations.length, 0);

  const original = useMemo(() => new Set(member.skills), [member.skills]);
  const added = [...draft].filter((id) => !original.has(id)).length;
  const removed = [...original].filter((id) => !draft.has(id));
  const changes = added + removed.length;

  // Prestations qu'on s'apprête à rendre impossibles à réserver.
  const soleNow = useMemo(
    () => soleProviderIds(member, allMembers, member.skills),
    [member, allMembers],
  );
  const lostNames = removed
    .filter((id) => soleNow.has(id))
    .map((id) => prestationSeeds.find((p) => p.id === id)?.name ?? id);

  const toggle = (id: string) =>
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setMany = (ids: string[], on: boolean) =>
    setDraft((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  return (
    <>
      <header className="flex items-start justify-between gap-6 border-b border-base-300 px-7 pb-5 pt-6">
        <div>
          <h2 id="skills-dialog-title" className="text-xl font-semibold text-base-content">
            Compétences de {member.firstName}
          </h2>
          <p className="mt-1 text-[15px] text-base-content/60">
            Cochez les prestations que {member.firstName} sait réaliser. Elle ne sera proposée que
            pour celles-ci à la réservation.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-field text-base-content/60 transition hover:bg-base-200 hover:text-base-content"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[272px_1fr]">
        {/* Sommaire des catégories */}
        <nav
          aria-label="Catégories"
          className="min-h-0 overflow-y-auto border-r border-base-300 bg-base-200/60 px-3 py-4"
        >
          <CategoryButton
            active={!searching && category === "all"}
            label="Toutes"
            count={draft.size}
            total={SKILL_TOTAL}
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          />
          <div className="my-2 h-px bg-base-300" />
          {SKILL_GROUPS.map((g) => (
            <CategoryButton
              key={g.id}
              active={!searching && category === g.id}
              label={g.label}
              count={g.prestations.filter((p) => draft.has(p.id)).length}
              total={g.prestations.length}
              onClick={() => {
                setQuery("");
                setCategory(g.id);
              }}
            />
          ))}
        </nav>

        {/* Recherche + liste */}
        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="border-b border-base-300 px-6 py-4">
            <SearchInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une prestation (nom ou sous-catégorie)…"
              aria-label="Rechercher une prestation"
            />
            {searching && (
              <p className="mt-2 text-sm text-base-content/60">
                {visibleCount === 0
                  ? "Aucun résultat"
                  : `${visibleCount} résultat${visibleCount > 1 ? "s" : ""} dans tout le catalogue`}
              </p>
            )}
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {visible.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] text-base-content/70">
                  Aucune prestation ne correspond à « {query.trim()} ».
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-2 text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                >
                  Effacer la recherche
                </button>
              </div>
            ) : (
              visible.map((g) => {
                const ids = g.prestations.map((p) => p.id);
                const allOn = ids.every((id) => draft.has(id));
                return (
                  <section key={g.id} className="pt-5">
                    <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between bg-base-100 px-6 py-2">
                      <h3 className="text-[15px] font-semibold text-base-content">
                        {g.label}
                        <span className="ml-2 text-sm font-normal tabular-nums text-base-content/60">
                          {ids.filter((id) => draft.has(id)).length} / {ids.length}
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMany(ids, !allOn)}
                        className="text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                      >
                        {allOn
                          ? searching
                            ? "Décocher ces résultats"
                            : "Tout décocher"
                          : searching
                            ? "Cocher ces résultats"
                            : "Tout cocher"}
                      </button>
                    </div>
                    <ul className="divide-y divide-base-300 rounded-box border border-base-300">
                      {g.prestations.map((p) => {
                        const checked = draft.has(p.id);
                        const sub = SUBCATEGORY_NAME.get(p.subcategoryId ?? "");
                        return (
                          <li key={p.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors",
                                checked ? "bg-accent/60" : "hover:bg-base-200",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(p.id)}
                                className="checkbox checkbox-primary checkbox-sm"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] font-medium text-base-content">
                                  {p.name}
                                </span>
                                {(sub || soleNow.has(p.id)) && (
                                  <span className="block truncate text-sm text-base-content/60">
                                    {sub}
                                    {sub && soleNow.has(p.id) && " · "}
                                    {soleNow.has(p.id) && (
                                      <span className="text-warning-700">
                                        Seule praticienne à la réaliser
                                      </span>
                                    )}
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-right text-sm tabular-nums text-base-content/60">
                                {durationLabel(p.durationMin)}
                                <span className="mx-1.5 text-base-content/30">·</span>
                                {fcfa(p.priceFcfa)}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-base-300 px-7 py-4">
        {lostNames.length > 0 && (
          <p className="mb-3 text-sm text-warning-700">
            {lostNames.length === 1
              ? `« ${lostNames[0]} » ne pourra plus être réservée : personne d'autre ne sait la réaliser.`
              : `${lostNames.length} prestations ne pourront plus être réservées : ${lostNames.join(", ")}.`}
          </p>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] text-base-content/70">
            <span className="font-semibold tabular-nums text-base-content">{draft.size}</span>{" "}
            prestation{draft.size > 1 ? "s" : ""} cochée{draft.size > 1 ? "s" : ""}
            {changes > 0 && (
              <span className="text-base-content/60">
                {" "}
                · {added > 0 && `${added} ajoutée${added > 1 ? "s" : ""}`}
                {added > 0 && removed.length > 0 && ", "}
                {removed.length > 0 && `${removed.length} retirée${removed.length > 1 ? "s" : ""}`}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button size="sm" disabled={changes === 0} onClick={() => onSave([...draft])}>
              Enregistrer
            </Button>
          </div>
        </div>
      </footer>
    </>
  );
}

function CategoryButton({
  active,
  label,
  count,
  total,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-field px-3 py-2.5 text-left text-[15px] transition-colors",
        active
          ? "bg-white font-semibold text-base-content shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-base-content/70 hover:bg-white/70 hover:text-base-content",
      )}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          count > 0 ? "text-secondary" : "text-base-content/45",
        )}
      >
        {count}/{total}
      </span>
    </button>
  );
}
