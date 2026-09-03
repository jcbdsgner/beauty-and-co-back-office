import type { Metadata } from "next";
import PageHeader from "@/components/back-office/PageHeader";
import { notifications, dateTime } from "@/lib/mock";

export const metadata: Metadata = { title: "Notifications | Homonyme" };

const DOT: Record<string, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  info: "bg-blue-light-500",
  neutral: "bg-gray-400",
};

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="System alerts and workspace events." action={{ label: "Mark all read" }} />
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-white/[0.03]">
        {notifications.map((n) => (
          <div key={n.id} className={`flex gap-3 p-5 ${n.read ? "" : "bg-brand-50/40 dark:bg-brand-500/[0.04]"}`}>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.tone]}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 dark:text-white/90">{n.title}</p>
                <span className="text-theme-xs text-gray-400">{dateTime(n.date)}</span>
              </div>
              <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
