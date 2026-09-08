import type { Metadata } from "next";
import Notifications from "@/components/back-office/Notifications";

export const metadata: Metadata = { title: "Notifications | Homonyme" };

export default function NotificationsPage() {
  return <Notifications />;
}
