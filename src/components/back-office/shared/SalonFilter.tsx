"use client";

import { useSyncExternalStore } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, MapPin } from "lucide-react";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import { cn } from "@/lib/utils";
import {
  SALON_CITIES,
  inScope,
  salonIdsOfCity,
  salonName,
  salons,
  sameScope,
  scopeFromIds,
  scopeIds,
  type SalonId,
  type SalonScope,
} from "@/lib/mock/beautyandco";

// Filtre salon global, monté par chaque écran à côté de son titre.
// - Jusqu'à 2 salons : bascule « Tous les salons / Almadies / Sea Plaza »
//   (trois pastilles tiennent dans un bandeau).
// - À partir de 3 : la bascule n'a plus la place et ne sait pas dire « ces
//   deux-là ». Bouton + menu à cases : « Tous les salons », un raccourci par
//   ville (Dakar coche Almadies + Sea Plaza, Abidjan coche Cocody), puis les
//   salons un par un. Le menu reste ouvert pendant qu'on coche ; on ne peut
//   pas tout décocher (le dernier salon coché reste coché).
//
// Activer `SIMULER_SALON_ABIDJAN` dans `@/lib/mock/beautyandco` pour le voir.

type Props = {
  value: SalonScope;
  onChange: (scope: SalonScope) => void;
  // `tinted` = taille compacte d'en-tête (bandeau `PageHeader`), comme la bascule.
  variant?: "neutral" | "tinted";
  // Libellé du « tout » — certains écrans disent « Tous » faute de place.
  allLabel?: string;
};

export default function SalonFilter({ value, onChange, variant = "tinted", allLabel = "Tous les salons" }: Props) {
  if (salons.length <= 2) {
    const current = value === "all" ? "all" : (scopeIds(value)[0] ?? "all");
    return (
      <SegmentedControl
        aria-label="Filtrer par salon"
        variant={variant}
        options={[
          { value: "all", label: allLabel },
          ...salons.map((s) => ({ value: s.id as string, label: s.name })),
        ]}
        value={current}
        onChange={(v) => onChange(v === "all" ? "all" : (v as SalonId))}
      />
    );
  }
  return <SalonMenu value={value} onChange={onChange} variant={variant} allLabel={allLabel} />;
}

function SalonMenu({ value, onChange, variant, allLabel }: Required<Props>) {
  const selected = scopeIds(value);
  const cities = SALON_CITIES.map((city) => ({ city, ids: salonIdsOfCity(city) })).filter((c) => c.ids.length > 0);

  const toggle = (id: SalonId) => {
    if (inScope(value, id)) {
      if (selected.length === 1) return; // au moins un salon reste coché
      onChange(scopeFromIds(selected.filter((x) => x !== id)));
    } else {
      onChange(scopeFromIds([...selected, id]));
    }
  };

  const label = value === "all" ? allLabel : salonName(value);
  const count = value === "all" ? null : selected.length;

  // Même parade que `header/UserDropdown` : l'id `useId` du déclencheur Radix ne
  // coïncide pas entre serveur et client → bouton statique au SSR, menu ensuite.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const trigger = (
    <button
      type="button"
      aria-label={`Filtrer par salon : ${label}`}
      className={cn(
        "inline-flex max-w-72 items-center gap-2 rounded-selector border border-base-300 bg-base-100 font-semibold text-base-content outline-none transition hover:bg-base-200 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-base-200",
        variant === "tinted" ? "h-11 px-3.5 text-sm" : "h-14 px-4 text-[15px]",
      )}
    >
      <MapPin aria-hidden className="size-4 shrink-0 text-base-content/55" />
      <span className="truncate">{label}</span>
      {count !== null && count > 1 && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-secondary tabular-nums">
          {count} salons
        </span>
      )}
      <ChevronDown aria-hidden className="size-4 shrink-0 text-base-content/55" />
    </button>
  );

  if (!hydrated) return trigger;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 overflow-hidden rounded-box border border-border bg-popover p-1.5 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.25)]"
        >
          <CheckRow checked={value === "all"} onSelect={() => onChange("all")} label={allLabel} hint={`${salons.length} salons`} />

          <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-border" />
          <MenuLabel>Par ville</MenuLabel>
          {cities.map(({ city, ids }) => (
            <CheckRow
              key={city}
              checked={value !== "all" && sameScope(value, scopeFromIds(ids))}
              onSelect={() => onChange(scopeFromIds(ids))}
              label={city}
              hint={ids.map((id) => salonName(id)).join(" · ")}
            />
          ))}

          <DropdownMenuPrimitive.Separator className="my-1.5 h-px bg-border" />
          <MenuLabel>Salons</MenuLabel>
          {cities.map(({ city, ids }) =>
            ids.map((id) => (
              <CheckRow
                key={id}
                checked={inScope(value, id)}
                disabled={inScope(value, id) && selected.length === 1}
                onSelect={() => toggle(id)}
                label={salonName(id)}
                hint={city}
              />
            )),
          )}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pt-1.5 pb-1 text-xs font-medium text-base-content/55">{children}</p>;
}

function CheckRow({
  checked,
  disabled,
  onSelect,
  label,
  hint,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      disabled={disabled}
      // Le menu reste ouvert : on coche plusieurs salons d'affilée.
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-field px-3 py-2 text-[15px] text-base-content/90 outline-none data-[highlighted]:bg-accent data-[disabled]:cursor-default"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-[5px] border",
          checked ? "border-primary bg-primary text-primary-content" : "border-base-300 bg-base-100",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {hint && <span className="block truncate text-xs text-base-content/55">{hint}</span>}
      </span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
