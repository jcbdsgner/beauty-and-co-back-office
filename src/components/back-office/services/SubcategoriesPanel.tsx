"use client";

import { useState } from "react";
import { TrashBinIcon } from "@/icons";
import { newId, type Service } from "@/lib/mock/services";
import { EmptyList, SectionCard, btnGhost } from "./ui";

type Props = {
  service: Service;
  onUpdate: (next: Service) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
};

const inputClass =
  "h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

// Sous-catégories d'une catégorie — lanes optionnelles du tableau Kanban
// (ex. Coiffure → Défrisage, Tissages & extensions…). Liste éditable en
// blocs : renommage en ligne, réordonnancement par flèches, suppression
// (les prestations qui y étaient rattachées retombent en « Autres », jamais
// perdues — `onDeleteSubcategory` gère aussi ce détachement côté écran).
export default function SubcategoriesPanel({ service, onUpdate, onDeleteSubcategory }: Props) {
  const [adding, setAdding] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const move = (id: string, dir: -1 | 1) => {
    const list = service.subcategories;
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onUpdate({ ...service, subcategories: next });
  };

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (renamingId && trimmed) {
      onUpdate({
        ...service,
        subcategories: service.subcategories.map((s) =>
          s.id === renamingId ? { ...s, name: trimmed } : s,
        ),
      });
    }
    setRenamingId(null);
  };

  const add = () => {
    const trimmed = adding.trim();
    if (!trimmed) return;
    onUpdate({
      ...service,
      subcategories: [...service.subcategories, { id: newId("sub"), name: trimmed }],
    });
    setAdding("");
  };

  return (
    <SectionCard
      title="Sous-catégories"
      description="Regroupe les prestations de cette catégorie en lanes sur le tableau (ex. Défrisage, Tissages…). Facultatif."
    >
      {service.subcategories.length === 0 ? (
        <EmptyList>Aucune sous-catégorie — les prestations s&apos;affichent à plat.</EmptyList>
      ) : (
        <ul className="space-y-2">
          {service.subcategories.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2"
            >
              <div className="flex shrink-0 flex-col text-gray-400">
                <button
                  type="button"
                  onClick={() => move(s.id, -1)}
                  disabled={i === 0}
                  aria-label={`Monter ${s.name}`}
                  className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 15V5M5 10l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(s.id, 1)}
                  disabled={i === service.subcategories.length - 1}
                  aria-label={`Descendre ${s.name}`}
                  className="rounded p-0.5 hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-30"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 5v10M5 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {renamingId === s.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className={inputClass}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => startRename(s.id, s.name)}
                  className="flex-1 truncate text-left text-theme-sm text-gray-800 hover:text-brand-600"
                >
                  {s.name}
                </button>
              )}

              {confirmId === s.id ? (
                <span className="flex shrink-0 items-center gap-2 text-theme-xs">
                  <span className="text-gray-500">Supprimer&nbsp;?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteSubcategory(s.id);
                      setConfirmId(null);
                    }}
                    className="font-semibold text-error-600 hover:underline"
                  >
                    Oui
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="font-medium text-gray-500 hover:underline"
                  >
                    Non
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(s.id)}
                  aria-label={`Supprimer la sous-catégorie ${s.name}`}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Nom de la sous-catégorie"
          className={inputClass}
        />
        <button type="button" onClick={add} disabled={!adding.trim()} className={btnGhost}>
          Ajouter
        </button>
      </div>
    </SectionCard>
  );
}
