import React from "react";
import PageHeader from "@/components/back-office/PageHeader";
import SettingsTabs from "@/components/back-office/SettingsTabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Settings" description="Workspace configuration. Changes are not persisted in this demo." />
      <SettingsTabs />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
