import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { products, currency, shortDate, type Product } from "@/lib/mock";

export const metadata: Metadata = { title: "Products | Homonyme" };

const columns: Column<Product>[] = [
  {
    key: "name",
    header: "Product",
    render: (p) => (
      <Link href={`/products/${p.id}`} className="flex items-center gap-3">
        <Image src={p.image} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
        <span>
          <span className="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{p.name}</span>
          <span className="block text-theme-xs text-gray-400">{p.sku}</span>
        </span>
      </Link>
    ),
  },
  { key: "category", header: "Category" },
  { key: "price", header: "Price", align: "right", render: (p) => currency(p.price) },
  {
    key: "stock",
    header: "Stock",
    align: "right",
    render: (p) => (
      <span className={p.stock === 0 ? "text-error-500" : p.stock < 10 ? "text-warning-600" : ""}>{p.stock}</span>
    ),
  },
  { key: "updatedAt", header: "Updated", render: (p) => shortDate(p.updatedAt) },
  { key: "status", header: "Status", render: (p) => <StatusBadge value={p.status} /> },
];

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog items across all categories."
        action={{ label: "Add product" }}
      />
      <div className="mb-4">
        <Link href="/products/categories" className="text-theme-sm text-brand-500 hover:underline">
          Manage categories →
        </Link>
      </div>
      <DataTable columns={columns} rows={products} rowKey={(p) => p.id} />
    </div>
  );
}
