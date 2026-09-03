import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/components/back-office/PageHeader";
import DataTable, { type Column } from "@/components/back-office/DataTable";
import StatusBadge from "@/components/back-office/StatusBadge";
import { team, dateTime, type TeamMember } from "@/lib/mock";

export const metadata: Metadata = { title: "Team | Homonyme" };

const columns: Column<TeamMember>[] = [
  {
    key: "name",
    header: "Member",
    render: (m) => (
      <Link href={`/team/${m.id}`} className="flex items-center gap-3">
        <Image src={m.avatar} alt={m.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
        <span>
          <span className="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{m.name}</span>
          <span className="block text-theme-xs text-gray-400">{m.email}</span>
        </span>
      </Link>
    ),
  },
  { key: "role", header: "Role" },
  { key: "team", header: "Team" },
  { key: "lastActive", header: "Last active", render: (m) => dateTime(m.lastActive) },
  { key: "status", header: "Status", render: (m) => <StatusBadge value={m.status} /> },
];

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="Team" description="People with access to this workspace." action={{ label: "Invite member" }} />
      <div className="mb-4">
        <Link href="/team/roles" className="text-theme-sm text-brand-500 hover:underline">
          Manage roles & permissions →
        </Link>
      </div>
      <DataTable columns={columns} rows={team} rowKey={(m) => m.id} />
    </div>
  );
}
