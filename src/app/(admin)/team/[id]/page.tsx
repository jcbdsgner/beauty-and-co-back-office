import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import PageHeader from "@/components/back-office/PageHeader";
import DefinitionList from "@/components/back-office/DefinitionList";
import StatusBadge from "@/components/back-office/StatusBadge";
import { teamMemberById, roles, dateTime } from "@/lib/mock";

export const metadata: Metadata = { title: "Member detail | Homonyme" };

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = teamMemberById(id);
  if (!member) notFound();
  const role = roles.find((r) => r.name === member.role);

  return (
    <div>
      <PageHeader title={member.name} description={member.email} backHref="/team" backLabel="Team" action={{ label: "Edit access" }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <Image src={member.avatar} alt={member.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
          <h3 className="mt-3 font-medium text-gray-800 dark:text-white/90">{member.name}</h3>
          <div className="mt-2"><StatusBadge value={member.status} /></div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <DefinitionList
            title="Access"
            items={[
              { label: "Role", value: member.role },
              { label: "Team", value: member.team },
              { label: "Last active", value: dateTime(member.lastActive) },
              { label: "Permissions", value: role ? role.permissions.join(", ") : "—" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
