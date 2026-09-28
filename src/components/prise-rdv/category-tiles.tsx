import Image from "next/image";
import { cn } from "@/lib/prise-rdv/utils";
import type { BookingService } from "@/lib/prise-rdv/data/booking-services";

type CategoryTilesProps = {
  services: BookingService[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  categoriesWithSelection: Set<string>;
};

export function CategoryTiles({
  services,
  activeCategoryId,
  onSelectCategory,
  categoriesWithSelection,
}: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {services.map((service) => {
        const isActive = service.id === activeCategoryId;
        const hasSelection = categoriesWithSelection.has(service.id);
        const checked = isActive || hasSelection;

        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelectCategory(service.id)}
            aria-pressed={isActive}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-white px-3.5 py-[18px] text-center transition",
              isActive ? "border-[var(--brand-taupe-muted)]" : "border-[var(--color-gray-300)] hover:border-[var(--brand-taupe-muted)]/50",
            )}
          >
            <span
              className={cn(
                "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-lg border-[1.5px] transition",
                checked ? "border-[var(--brand-taupe-muted)] bg-[var(--brand-taupe-muted)]" : "border-[var(--color-gray-300)] bg-white",
              )}
            >
              {checked && <Image src="/images/rdv/icon-check.svg" alt="" width={14} height={14} />}
            </span>
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-lg bg-[rgba(237,220,218,0.4)]">
              <Image
                src={service.image}
                alt=""
                width={service.iconOnly ? 24 : 44}
                height={service.iconOnly ? 24 : 44}
                className={service.iconOnly ? undefined : "size-full object-cover"}
              />
            </span>
            <span className="flex min-h-10 items-center justify-center text-[17px] font-bold text-[var(--color-gray-800)] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
              {service.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
