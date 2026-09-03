import type { Metadata } from "next";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { FormCard, ToggleRow } from "@/components/back-office/FormCard";

export const metadata: Metadata = { title: "Security settings | Homonyme" };

export default function SecuritySettingsPage() {
  return (
    <>
      <FormCard title="Password">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" defaultValue="********" />
        </div>
        <div>
          <Label htmlFor="new">New password</Label>
          <Input id="new" type="password" placeholder="At least 12 characters" />
        </div>
      </FormCard>
      <FormCard title="Two-factor authentication" footer={false}>
        <ToggleRow label="Authenticator app" description="Require a TOTP code at sign-in" on />
        <ToggleRow label="SMS backup" description="Send a code by text if the app is unavailable" />
      </FormCard>
      <FormCard title="Sessions" footer={false}>
        <ToggleRow label="Sign out other sessions" description="End all sessions except this one" />
      </FormCard>
    </>
  );
}
