import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import { products, currency, shortDate } from "@/lib/mock";

export const metadata: Metadata = { title: "Product detail | Homonyme" };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        backHref="/products"
        backLabel="Products"
        action={{ label: "Edit product" }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={400}
            className="aspect-square w-full rounded-xl object-cover"
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <DefinitionList
            title="Overview"
            items={[
              { label: "Status", value: <StatusBadge value={product.status} /> },
              { label: "Category", value: product.category },
              { label: "Price", value: currency(product.price) },
              { label: "Stock on hand", value: product.stock },
              { label: "Last updated", value: shortDate(product.updatedAt) },
            ]}
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Description, variants, media gallery and inventory history would live here. This screen is a
            front-end placeholder with mock data.
          </div>
        </div>
      </div>
    </div>
  );
}
