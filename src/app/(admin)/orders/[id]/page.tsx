import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import { orderById, currency, dateTime, type OrderItem } from "@/lib/mock";

export const metadata: Metadata = { title: "Order detail | Homonyme" };

const itemColumns: Column<OrderItem>[] = [
  { key: "name", header: "Product" },
  { key: "qty", header: "Qty", align: "right" },
  { key: "price", header: "Unit price", align: "right", render: (i) => currency(i.price) },
  { key: "line", header: "Line total", align: "right", render: (i) => currency(i.price * i.qty) },
];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orderById(id);
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        title={`Order ${order.number}`}
        description={`Placed ${dateTime(order.date)}`}
        backHref="/orders"
        backLabel="Orders"
        action={{ label: "Refund" }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DataTable columns={itemColumns} rows={order.items} rowKey={(i) => i.name} />
          <DefinitionList
            title="Payment summary"
            items={[
              { label: "Subtotal", value: currency(order.total) },
              { label: "Shipping", value: currency(0) },
              { label: "Tax", value: currency(0) },
              { label: "Total", value: <strong>{currency(order.total)}</strong> },
            ]}
          />
        </div>
        <div className="space-y-6">
          <DefinitionList
            title="Details"
            items={[
              { label: "Status", value: <StatusBadge value={order.status} /> },
              { label: "Fulfillment", value: <StatusBadge value={order.fulfillment} /> },
              { label: "Payment method", value: order.payment },
              { label: "Order ID", value: order.id },
            ]}
          />
          <DefinitionList
            title="Customer"
            items={[
              { label: "Name", value: order.customer },
              { label: "Email", value: order.email },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
