import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import { roles } from "@/lib/mock";

export const metadata: Metadata = { title: "Roles & permissions | Homonyme" };

export default function RolesPage() {
  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="What each role can see and do."
        backHref="/team"
        backLabel="Team"
        action={{ label: "New role" }}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800 dark:text-white/90">{role.name}</h3>
              <span className="text-theme-xs text-gray-400">{role.members} member{role.members > 1 ? "s" : ""}</span>
            </div>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{role.description}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {role.permissions.map((p) => (
                <li key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
