import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { categories, type Category } from "@/lib/mock";

export const metadata: Metadata = { title: "Categories | Homonyme" };

const columns: Column<Category>[] = [
  { key: "name", header: "Category", render: (c) => <span className="font-medium text-gray-800 dark:text-white/90">{c.name}</span> },
  { key: "slug", header: "Slug", render: (c) => <code className="text-theme-xs text-gray-500">/{c.slug}</code> },
  { key: "description", header: "Description" },
  { key: "products", header: "Products", align: "right" },
];

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group products for navigation and reporting."
        backHref="/products"
        backLabel="Products"
        action={{ label: "New category" }}
      />
      <DataTable columns={columns} rows={categories} rowKey={(c) => c.id} />
    </div>
  );
}
