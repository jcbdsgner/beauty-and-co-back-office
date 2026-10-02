"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { salonName, singleSalon, type SalonScope } from "@/lib/mock/beautyandco";
import {
  groupPrestationsBySubcategory,
  isUnbookable,
  orphanPrestations,
  orphanQuestions,
  prestationsForSalon,
  serviceRows,
  type Prestation,
  type Service,
  type ServiceQuestion,
} from "@/lib/mock/services";
import CategoryThumb from "../shared/CategoryThumb";
import CategorySection from "./CategorySection";
import UnassignedSection from "./UnassignedSection";

type StatusFilter = "all" | "inactive" | "unbookable" | "two";

type Props = {
  services: Service[];
  prestations: Prestation[];
  questions: ServiceQuestion[];
  scope: SalonScope;
  onReorderServices: (next: Service[]) => void;
  onToggleServiceActive: (service: Service, active: boolean) => void;
  onDeleteService: (id: string) => void;
  onOpenCategory: (id: string) => void;
  onOpenNewCategory: () => void;
  onOpenPrestation: (id: string) => void;
  onOpenNewPrestation: (serviceId: string, subcategoryId: string | null) => void;
  onTogglePrestation: (p: Prestation, active: boolean) => void;
  onAttachOrphanPrestation: (id: string, serviceId: string) => void;
  onDeleteOrphanPrestation: (id: string) => void;
  onAttachOrphanQuestion: (id: string, serviceId: string) => void;
  onDeleteOrphanQuestion: (id: string) => void;
};

const fold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MATCHES: Record<StatusFilter, (p: Prestation) => boolean> = {
  all: () => true,
  inactive: (p) => !p.active,
  unbookable: isUnbookable,
  two: (p) => Boolean(p.twoPractitioners),
};

const sectionId = (serviceId: string) => `categorie-${serviceId}`;

// Carte des services (2026-09-27, remplace le tableau Kanban) — tout le
// catalogue sur une seule page qui défile, une section par catégorie, avec un
// sommaire fixe à gauche.
//
// 1. Ce que la propriétaire vient faire : surtout retrouver une prestation
//    (son prix, sa durée), la corriger ou la couper ; plus rarement en ajouter
//    une ; très rarement réorganiser. La recherche couvre tout le catalogue ;
//    la recatégorisation passe par la fiche (champ « Catégorie ») et l'ordre
//    des catégories par le menu de section — des gestes explicites, plus de
//    glisser-déposer qu'on déclenche par accident.
// 2. Ce qui saute aux yeux : les noms et les prix, alignés en colonne pour
//    se comparer d'un regard ; puis ce qui cloche (Non réservable, Inactive).
// 3. Quand ça se passe mal : éléments sans catégorie → section d'alerte en
//    tête ; catégorie vide → état vide avec ajout direct ; recherche sans
//    résultat → message + effacer ; filtre salon → mention des prestations
//    masquées plutôt qu'une disparition silencieuse.
export default function ServicesCatalog({
  services,
  prestations,
  questions,
  scope,
  onReorderServices,
  onToggleServiceActive,
  onDeleteService,
  onOpenCategory,
  onOpenNewCategory,
  onOpenPrestation,
  onOpenNewPrestation,
  onTogglePrestation,
  onAttachOrphanPrestation,
  onDeleteOrphanPrestation,
  onAttachOrphanQuestion,
  onDeleteOrphanQuestion,
}: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows = serviceRows(services, prestations, questions, scope);
  const orphanPres = orphanPrestations(prestations);
  const orphanQues = orphanQuestions(questions);
  const hasOrphans = orphanPres.length + orphanQues.length > 0;

  // Prestations proposées dans le salon affiché, rangées dans une catégorie visible.
  const visibleServiceIds = new Set(rows.map((r) => r.service.id));
  const inCatalog = prestations.filter((p) => p.serviceId && visibleServiceIds.has(p.serviceId));
  const inSalon = prestationsForSalon(inCatalog, scope);
  const hiddenBySalon = inCatalog.length - inSalon.length;

  const q = fold(query.trim());
  const filtering = q !== "" || status !== "all";
  const shown = inSalon.filter((p) => MATCHES[status](p) && (q === "" || fold(p.name).includes(q)));

  const counts = {
    inactive: inSalon.filter(MATCHES.inactive).length,
    unbookable: inSalon.filter(MATCHES.unbookable).length,
    two: inSalon.filter(MATCHES.two).length,
  };

  const sections = rows
    .map((row) => {
      const own = shown.filter((p) => p.serviceId === row.service.id);
      const total = inSalon.filter((p) => p.serviceId === row.service.id).length;
      return { row, own, total, groups: groupPrestationsBySubcategory(row.service, own) };
    })
    .filter((s) => !filtering || s.own.length > 0);

  // Réordonner n'a de sens que sur la liste complète : sous un filtre salon,
  // un voisin masqué donnerait l'impression que rien ne bouge.
  const canReorder = scope === "all";
  const move = (id: string, delta: -1 | 1) => {
    const i = services.findIndex((s) => s.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= services.length) return;
    const next = [...services];
    [next[i], next[j]] = [next[j], next[i]];
    onReorderServices(next);
  };

  // Sommaire : met en avant la section en cours de lecture.
  const sectionKey = sections.map((s) => s.row.service.id).join("|") + (hasOrphans ? "|sans" : "");
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("section[id^='categorie-']"));
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveId(top.target.id);
      },
      { rootMargin: "-96px 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionKey]);

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  const navCounts = new Map<string, number>();
  for (const p of shown) if (p.serviceId) navCounts.set(p.serviceId, (navCounts.get(p.serviceId) ?? 0) + 1);

  return (
    <div className="grid grid-cols-[288px_minmax(0,1fr)] items-start gap-8">
      <nav aria-label="Catégories" className="sticky top-8 space-y-1">
        <p className="px-3 pb-2 text-sm font-medium uppercase tracking-wide text-base-content/45">
          Catégories
        </p>
        {hasOrphans && (
          <NavItem
            active={activeId === "categorie-sans"}
            onClick={() => jumpTo("categorie-sans")}
            label="Sans catégorie"
            count={orphanPres.length + orphanQues.length}
            warn
          />
        )}
        {rows.map((row) => {
          const id = sectionId(row.service.id);
          const count = navCounts.get(row.service.id) ?? 0;
          const present = !filtering || count > 0;
          return (
            <NavItem
              key={row.service.id}
              active={activeId === id}
              disabled={!present}
              onClick={() => jumpTo(id)}
              label={row.service.name}
              image={row.service.image}
              count={count}
              warn={present && row.service.active && row.unbookableCount > 0}
              muted={!row.service.active}
            />
          );
        })}
        <button
          type="button"
          onClick={onOpenNewCategory}
          className="mt-2 flex w-full items-center gap-2.5 rounded-field px-3 py-3 text-[16px] font-medium text-brand-600 transition hover:bg-accent hover:text-secondary"
        >
          <Plus aria-hidden className="size-5" />
          Nouvelle catégorie
        </button>
      </nav>

      <div className="min-w-0 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une prestation"
              aria-label="Rechercher une prestation"
              className="max-w-sm"
            />
            <div role="group" aria-label="Filtrer les prestations" className="flex items-center gap-2">
              {(
                [
                  { value: "all", label: "Toutes", count: inSalon.length },
                  { value: "unbookable", label: "Non réservables", count: counts.unbookable },
                  { value: "inactive", label: "Inactives", count: counts.inactive },
                  { value: "two", label: "À deux", count: counts.two },
                ] as { value: StatusFilter; label: string; count: number }[]
              ).map((o) => {
                const on = status === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStatus(o.value)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition ${
                      on
                        ? "border-primary bg-primary text-primary-content"
                        : "border-base-300 bg-base-100 text-base-content/70 hover:border-brand-300 hover:text-base-content"
                    }`}
                  >
                    {o.label}
                    <span className={`tabular-nums ${on ? "text-primary-content/70" : "text-base-content/45"}`}>
                      {o.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {hiddenBySalon > 0 && (
            <p className="text-sm text-base-content/60">
              {hiddenBySalon} prestation{hiddenBySalon > 1 ? "s" : ""} non proposée
              {hiddenBySalon > 1 ? "s" : ""} à {salonName(scope)}{" "}
              {hiddenBySalon > 1 ? "sont masquées" : "est masquée"}.
            </p>
          )}
        </div>

        {hasOrphans && (
          <UnassignedSection
            services={services}
            prestations={orphanPres}
            questions={orphanQues}
            onAttachPrestation={onAttachOrphanPrestation}
            onDeletePrestation={onDeleteOrphanPrestation}
            onAttachQuestion={onAttachOrphanQuestion}
            onDeleteQuestion={onDeleteOrphanQuestion}
          />
        )}

        {sections.length === 0 && filtering && (
          <div className="rounded-box border border-dashed border-base-300 px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-base-content">
              {q ? `Aucune prestation ne correspond à « ${query.trim()} ».` : "Aucune prestation dans ce filtre."}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
              className="mt-3 text-sm font-medium text-brand-600 hover:underline"
            >
              Tout afficher
            </button>
          </div>
        )}

        {rows.length === 0 && !filtering && (
          <div className="rounded-box border border-dashed border-base-300 px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-base-content">
              Aucune catégorie {scope === "all" ? "pour l'instant" : singleSalon(scope) ? "proposée dans ce salon" : "proposée dans ces salons"}.
            </p>
            <button
              type="button"
              onClick={onOpenNewCategory}
              className="mt-3 text-sm font-medium text-brand-600 hover:underline"
            >
              Créer une catégorie
            </button>
          </div>
        )}

        {sections.map(({ row, total, groups }) => {
          const index = services.findIndex((s) => s.id === row.service.id);
          return (
            <CategorySection
              key={row.service.id}
              service={row.service}
              groups={groups}
              prestationCount={total}
              questionCount={row.questionCount}
              filtering={filtering}
              canMoveUp={canReorder && index > 0}
              canMoveDown={canReorder && index < services.length - 1}
              onOpenCategory={() => onOpenCategory(row.service.id)}
              onOpenPrestation={onOpenPrestation}
              onAddPrestation={(subcategoryId) => onOpenNewPrestation(row.service.id, subcategoryId)}
              onTogglePrestation={onTogglePrestation}
              onToggleActive={(active) => onToggleServiceActive(row.service, active)}
              onMove={(delta) => move(row.service.id, delta)}
              onDelete={() => onDeleteService(row.service.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function NavItem({
  label,
  count,
  image,
  active,
  disabled,
  warn,
  muted,
  onClick,
}: {
  label: string;
  count: number;
  image?: string | null;
  active: boolean;
  disabled?: boolean;
  warn?: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "location" : undefined}
      className={`flex w-full items-center gap-3 rounded-field px-3 py-3 text-left text-[17px] transition disabled:cursor-default disabled:opacity-40 ${
        active
          ? "bg-accent font-semibold text-secondary"
          : "text-base-content/75 hover:bg-muted hover:text-base-content"
      }`}
    >
      {image !== undefined && <CategoryThumb image={image} name={label} size={36} />}
      <span className={`min-w-0 flex-1 leading-snug ${muted ? "text-base-content/45" : ""}`}>{label}</span>
      {warn && (
        <span
          aria-label="Contient des prestations non réservables"
          title="Contient des prestations non réservables"
          className="size-2 shrink-0 rounded-full bg-warning-500"
        />
      )}
      <span className="shrink-0 text-sm tabular-nums text-base-content/55">{count}</span>
    </button>
  );
}
