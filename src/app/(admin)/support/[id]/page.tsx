import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import { ticketById, dateTime } from "@/lib/mock";

export const metadata: Metadata = { title: "Ticket detail | Homonyme" };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = ticketById(id);
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`From ${ticket.requester} · ${ticket.channel}`}
        backHref="/support"
        backLabel="Support"
        action={{ label: "Reply" }}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{ticket.requester}</p>
            <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-300">
              Hi team, {ticket.subject.toLowerCase()}. Could you take a look? Thanks.
            </p>
            <p className="mt-3 text-theme-xs text-gray-400">{dateTime(ticket.updatedAt)}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-theme-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
            Reply composer placeholder.
          </div>
        </div>
        <DefinitionList
          title="Ticket"
          items={[
            { label: "Status", value: <StatusBadge value={ticket.status} /> },
            { label: "Priority", value: ticket.priority },
            { label: "Assignee", value: ticket.assignee },
            { label: "Channel", value: ticket.channel },
            { label: "Updated", value: dateTime(ticket.updatedAt) },
          ]}
        />
      </div>
    </div>
  );
}
