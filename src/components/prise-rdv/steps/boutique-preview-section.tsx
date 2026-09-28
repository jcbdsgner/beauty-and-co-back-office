import Image from "next/image";
import { boutiqueHighlights } from "@/lib/prise-rdv/data/boutique-highlights";
import { formatPrice } from "@/lib/prise-rdv/format";

type BoutiquePreviewSectionProps = {
  productQuantities: Record<string, number>;
  onQuantityChange: (id: string, quantity: number) => void;
  selectedSizeByProductId: Record<string, string>;
  onSizeChange: (id: string, size: string) => void;
};

export function BoutiquePreviewSection({
  productQuantities,
  onQuantityChange,
  selectedSizeByProductId,
  onSizeChange,
}: BoutiquePreviewSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-gray-100)] bg-white p-6">
      <h3 className="font-[family-name:var(--font-prata)] text-[25px] font-bold text-[var(--brand-taupe-muted)]">
        En plus de la prestation coiffure, souhaitez-vous prendre des extensions ?
      </h3>
      <p className="mt-1 text-[17px] text-[var(--color-gray-500)]">
        Réservez les mêmes extensions que nos coiffeuses utilisent, à récupérer le jour de votre rendez-vous.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {boutiqueHighlights.map((product) => {
          const quantity = productQuantities[product.id] ?? 0;
          const selectedSize = selectedSizeByProductId[product.id] ?? product.sizes[0].label;
          const activeSize = product.sizes.find((size) => size.label === selectedSize) ?? product.sizes[0];
          return (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-100)]"
            >
              <div className="relative aspect-square w-full border-b border-[var(--color-gray-100)] bg-[var(--brand-cream)]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="truncate text-[17px] font-bold text-[var(--color-gray-800)]" title={product.name}>
                  {product.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size.label}
                      type="button"
                      onClick={() => onSizeChange(product.id, size.label)}
                      className={`rounded-full border px-3 py-1 text-[14px] font-[450] transition ${
                        size.label === activeSize.label
                          ? "border-[var(--brand-taupe-muted)] bg-[var(--brand-taupe-muted)] text-white"
                          : "border-[var(--color-gray-100)] bg-white text-[var(--color-gray-500)] hover:border-[var(--brand-taupe-muted)]/50"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
                <span className="flex items-center gap-2 text-[19px] font-bold text-[var(--brand-taupe-muted)]">
                  {formatPrice(activeSize.price)}
                  {activeSize.originalPrice !== undefined && (
                    <span className="text-[15px] font-[450] text-[var(--color-gray-400)] line-through">
                      {formatPrice(activeSize.originalPrice)}
                    </span>
                  )}
                </span>
                {product.inStock ? (
                  quantity > 0 ? (
                    <div className="mt-auto flex items-center justify-center gap-1 rounded-full border border-[var(--color-gray-100)] bg-white p-1">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity - 1)}
                        aria-label={`Diminuer la quantité — ${product.name}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-70"
                      >
                        <Image src="/images/rdv/icon-stepper-minus.svg" alt="" width={26} height={26} />
                      </button>
                      <span className="min-w-[44px] rounded-md border border-[var(--color-gray-100)] px-2.5 py-1 text-center text-[19px] font-bold text-[var(--color-gray-800)]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(product.id, quantity + 1)}
                        aria-label={`Augmenter la quantité — ${product.name}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-70"
                      >
                        <Image src="/images/rdv/icon-stepper-plus.svg" alt="" width={26} height={26} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onQuantityChange(product.id, 1)}
                      className="mt-auto rounded-full border border-[var(--brand-taupe-muted)] bg-white py-2 text-[17px] font-[450] text-[var(--brand-taupe-muted)] transition hover:bg-[var(--brand-taupe-muted)]/5"
                    >
                      Réserver
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-auto cursor-not-allowed rounded-full border border-[var(--color-gray-100)] bg-[var(--brand-cream)] py-2 text-[17px] font-[450] text-[var(--color-gray-400)]"
                  >
                    Rupture de stock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
