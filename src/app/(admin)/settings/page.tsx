import type { Metadata } from "next";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormCard } from "@/components/back-office/FormCard";

export const metadata: Metadata = { title: "General settings | Homonyme" };

export default function GeneralSettingsPage() {
  return (
    <>
      <FormCard title="Workspace" description="Basic information about your organization.">
        <div>
          <Label htmlFor="ws-name">Workspace name</Label>
          <Input id="ws-name" defaultValue="Homonyme" />
        </div>
        <div>
          <Label htmlFor="ws-url">Workspace URL</Label>
          <Input id="ws-url" defaultValue="homonyme.app" />
        </div>
        <div>
          <Label htmlFor="ws-email">Support email</Label>
          <Input id="ws-email" type="email" defaultValue="support@homonyme.app" />
        </div>
      </FormCard>

      <FormCard title="Localization" description="Formats used across the dashboard.">
        <div>
          <Label htmlFor="tz">Timezone</Label>
          <Input id="tz" defaultValue="UTC (GMT+0)" />
        </div>
        <div>
          <Label htmlFor="currency">Default currency</Label>
          <Input id="currency" defaultValue="USD" />
        </div>
      </FormCard>
    </>
  );
}
