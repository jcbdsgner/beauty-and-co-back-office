"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon } from "@/icons";
import { clients, type ClientRow, type SalonScope } from "@/lib/mock/beautyandco";
import PersonCard from "./PersonCard";

// Combobox maison de recherche cliente (nom OU téléphone) — pas de cmdk/radix
// côté back-office. Reprend le pattern de point-de-vente/components/shared/
// client-search-field.tsx : input qui sert de trigger + menu positionné dessous,
// filtrage synchrone (pas de debounce), item de création à la volée toujours
// visible en bas. Partagé par BookingDialog et toute future recherche cliente.

export type ClientPick =
  | { kind: "existing"; client: ClientRow }
  | { kind: "new"; name: string; phone: string };

type ClientSearchFieldProps = {
  scope: SalonScope;
  value: ClientPick | null;
  onChange: (pick: ClientPick) => void;
  placeholder?: string;
  label?: string;
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const digitsOf = (s: string) => s.replace(/\D/g, "");

// Saisie qui ressemble à un numéro → pré-remplit le téléphone plutôt que le nom.
const PHONE_LIKE = /^[+\d\s().-]+$/;

function draftFromQuery(query: string): { name: string; phone: string } {
  const q = query.trim();
  if (q && /\d/.test(q) && PHONE_LIKE.test(q)) return { name: "", phone: q };
  return { name: q, phone: "" };
}

const pickLabel = (pick: ClientPick) => (pick.kind === "existing" ? pick.client.name : pick.name);

export default function ClientSearchField({
  scope,
  value,
  onChange,
  placeholder = "Nom ou téléphone…",
  label,
}: ClientSearchFieldProps) {
  const [query, setQuery] = useState(() => (value ? pickLabel(value) : ""));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resynchronise l'affichage quand le parent change/efface la sélection
  // (ex. reset de formulaire) sans passer par une sélection interne — ajusté
  // pendant le rendu plutôt que dans un effet (pattern React recommandé pour
  // dériver un state d'une prop, évite un aller-retour de rendu superflu).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value ? pickLabel(value) : "");
    setActiveIndex(-1);
  }

  const all = useMemo(() => clients(scope), [scope]);

  const trimmed = query.trim();
  const q = normalize(trimmed);
  const qDigits = digitsOf(trimmed);

  const results = useMemo(() => {
    if (!q && qDigits.length < 2) return [];
    return all
      .filter((c) => {
        const byText = q !== "" && normalize(c.name).includes(q);
        const byPhone = qDigits.length >= 2 && digitsOf(c.phone).includes(qDigits);
        return byText || byPhone;
      })
      .slice(0, 6);
  }, [all, q, qDigits]);

  // Index 0..results.length-1 = résultats, results.length = item de création.
  const itemCount = results.length + 1;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const selectExisting = (client: ClientRow) => {
    onChange({ kind: "existing", client });
    setQuery(client.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const selectCreate = () => {
    const draft = draftFromQuery(query);
    onChange({ kind: "new", ...draft });
    setOpen(false);
    setActiveIndex(-1);
  };

  const selectIndex = (index: number) => {
    if (index < results.length) selectExisting(results[index]);
    else selectCreate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0) {
        e.preventDefault();
        selectIndex(activeIndex);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const createLabel = trimmed ? (
    <>
      Ajouter «&nbsp;{trimmed}&nbsp;» comme nouvelle cliente
    </>
  ) : (
    "Créer une nouvelle cliente"
  );
  const createIndex = results.length;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-base-content/80">{label}</label>
      )}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="client-search-listbox"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-10 w-full rounded-field border border-base-300 bg-white px-3 text-sm text-base-content focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
      />

      {open && (
        <div
          id="client-search-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-xl border border-base-300 bg-white py-1 shadow-theme-lg"
        >
          {trimmed === "" ? (
            all.length > 0 && (
              <p className="px-3 py-2 text-xs text-base-content/45">
                {all.length} {all.length > 1 ? "clientes" : "cliente"} au répertoire.
              </p>
            )
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-base-content/60">
              Aucune cliente trouvée.
            </p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={activeIndex === i}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectExisting(c)}
                className={`block w-full text-left ${activeIndex === i ? "bg-base-200" : ""}`}
              >
                <PersonCard
                  name={c.name}
                  meta={c.phone}
                  badgeLabel={c.segment === "a-relancer" ? "À relancer" : undefined}
                  badgeColor="warning"
                />
              </button>
            ))
          )}

          <button
            type="button"
            role="option"
            aria-selected={activeIndex === createIndex}
            onMouseEnter={() => setActiveIndex(createIndex)}
            onClick={selectCreate}
            className={`flex w-full items-center gap-2 border-t border-base-300 px-3 py-2.5 text-left text-sm font-medium text-brand-600 ${
              activeIndex === createIndex ? "bg-base-200" : ""
            }`}
          >
            <PlusIcon className="h-4 w-4 shrink-0" />
            {createLabel}
          </button>
        </div>
      )}
    </div>
  );
}
