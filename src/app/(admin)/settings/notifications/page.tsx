import type { Metadata } from "next";
import { FormCard, ToggleRow } from "@/components/back-office/FormCard";

export const metadata: Metadata = { title: "Notification settings | Homonyme" };

export default function NotificationSettingsPage() {
  return (
    <>
      <FormCard title="Email notifications">
        <ToggleRow label="New order" description="When a customer places an order" on />
        <ToggleRow label="Failed payment" description="When a charge is declined" on />
        <ToggleRow label="New customer" description="When someone signs up" />
        <ToggleRow label="Weekly summary" description="Revenue and growth digest every Monday" on />
      </FormCard>
      <FormCard title="Slack notifications">
        <ToggleRow label="Critical alerts" description="Payment failures and outages" on />
        <ToggleRow label="Daily recap" />
      </FormCard>
    </>
  );
}
