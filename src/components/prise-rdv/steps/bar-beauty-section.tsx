import Image from "next/image";
import { barBeautyDrinks, barBeautyNote } from "@/lib/prise-rdv/data/bar-beauty";
import { formatPrice } from "@/lib/prise-rdv/format";

type BarBeautySectionProps = {
  reservedDrinkIds: Set<string>;
  onToggleDrink: (id: string) => void;
};

export function BarBeautySection({ reservedDrinkIds, onToggleDrink }: BarBeautySectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-gray-100)] bg-white p-6">
      <h3 className="font-[family-name:var(--font-prata)] text-[25px] font-bold text-[var(--brand-taupe-muted)]">
        Le Bar Beauty
      </h3>
      <p className="mt-1 text-[17px] text-[var(--color-gray-500)]">
        Envie d&apos;une pause gourmande pendant votre soin ? Réservez votre boisson, elle vous sera
        servie sur place.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {barBeautyDrinks.map((drink) => {
          const isReserved = reservedDrinkIds.has(drink.id);
          return (
            <div
              key={drink.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-100)]"
            >
              <div className="relative aspect-[24/31] w-full bg-[var(--brand-cream)]">
                <Image
                  src={drink.image}
                  alt={drink.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-[17px] font-bold text-[var(--color-gray-800)]">{drink.name}</p>
                <p className="flex-1 text-[15px] text-[var(--color-gray-500)]">{drink.description}</p>
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[17px] font-bold whitespace-nowrap text-[var(--color-gray-800)]">
                    {formatPrice(drink.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleDrink(drink.id)}
                    aria-pressed={isReserved}
                    className={
                      isReserved
                        ? "w-full rounded-full border border-[var(--brand-taupe-muted)] bg-[var(--brand-taupe-muted)] px-4 py-1.5 text-[15px] font-[450] whitespace-nowrap text-white transition hover:opacity-90 sm:w-auto sm:shrink-0"
                        : "w-full rounded-full border border-[var(--brand-taupe-muted)] bg-white px-4 py-1.5 text-[15px] font-[450] whitespace-nowrap text-[var(--brand-taupe-muted)] transition hover:bg-[var(--brand-taupe-muted)]/5 sm:w-auto sm:shrink-0"
                    }
                  >
                    {isReserved ? "Réservé" : "Réserver"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] text-[var(--color-gray-400)]">{barBeautyNote}</p>
    </div>
  );
}
