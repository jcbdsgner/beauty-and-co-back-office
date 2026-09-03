import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { customers, orders, currency, shortDate, dateTime, type Order } from "@/lib/mock";

export const metadata: Metadata = { title: "Customer detail | Homonyme" };

const orderColumns: Column<Order>[] = [
  { key: "number", header: "Order" },
  { key: "date", header: "Date", render: (o) => dateTime(o.date) },
  { key: "total", header: "Total", align: "right", render: (o) => currency(o.total) },
  { key: "status", header: "Status", render: (o) => <StatusBadge value={o.status} /> },
];

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = customers.find((c) => c.id === id);
  if (!customer) notFound();
  const customerOrders = orders.filter((o) => o.customer === customer.name);

  return (
    <div>
      <PageHeader title={customer.name} description={customer.company} backHref="/customers" backLabel="Customers" action={{ label: "Message" }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <Image src={customer.avatar} alt={customer.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
            <h3 className="mt-3 font-medium text-gray-800 dark:text-white/90">{customer.name}</h3>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
            <div className="mt-3"><StatusBadge value={customer.status} /></div>
          </div>
          <DefinitionList
            title="Account"
            items={[
              { label: "Plan", value: customer.plan },
              { label: "MRR", value: currency(customer.mrr) },
              { label: "Country", value: customer.country },
              { label: "Customer since", value: shortDate(customer.createdAt) },
              { label: "Last seen", value: shortDate(customer.lastSeen) },
            ]}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Orders</h3>
            <DataTable columns={orderColumns} rows={customerOrders} rowKey={(o) => o.id} empty="No orders yet" />
          </div>
        </div>
      </div>
    </div>
  );
}
