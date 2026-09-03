import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Avatar from "@/components/ui/avatar/Avatar";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Avatars | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Avatars page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function AvatarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Avatar" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Default Avatar">
          {/* Default Avatar (No Status) */}
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar src="/images/avatar.png" size="xsmall" />
            <Avatar src="/images/avatar.png" size="small" />
            <Avatar src="/images/avatar.png" size="medium" />
            <Avatar src="/images/avatar.png" size="large" />
            <Avatar src="/images/avatar.png" size="xlarge" />
            <Avatar src="/images/avatar.png" size="xxlarge" />
          </div>
        </ComponentCard>
        <ComponentCard title="Avatar with online indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="/images/avatar.png"
              size="xsmall"
              status="online"
            />
            <Avatar
              src="/images/avatar.png"
              size="small"
              status="online"
            />
            <Avatar
              src="/images/avatar.png"
              size="medium"
              status="online"
            />
            <Avatar
              src="/images/avatar.png"
              size="large"
              status="online"
            />
            <Avatar
              src="/images/avatar.png"
              size="xlarge"
              status="online"
            />
            <Avatar
              src="/images/avatar.png"
              size="xxlarge"
              status="online"
            />
          </div>
        </ComponentCard>
        <ComponentCard title="Avatar with Offline indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="/images/avatar.png"
              size="xsmall"
              status="offline"
            />
            <Avatar
              src="/images/avatar.png"
              size="small"
              status="offline"
            />
            <Avatar
              src="/images/avatar.png"
              size="medium"
              status="offline"
            />
            <Avatar
              src="/images/avatar.png"
              size="large"
              status="offline"
            />
            <Avatar
              src="/images/avatar.png"
              size="xlarge"
              status="offline"
            />
            <Avatar
              src="/images/avatar.png"
              size="xxlarge"
              status="offline"
            />
          </div>
        </ComponentCard>{" "}
        <ComponentCard title="Avatar with busy indicator">
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Avatar
              src="/images/avatar.png"
              size="xsmall"
              status="busy"
            />
            <Avatar src="/images/avatar.png" size="small" status="busy" />
            <Avatar
              src="/images/avatar.png"
              size="medium"
              status="busy"
            />
            <Avatar src="/images/avatar.png" size="large" status="busy" />
            <Avatar
              src="/images/avatar.png"
              size="xlarge"
              status="busy"
            />
            <Avatar
              src="/images/avatar.png"
              size="xxlarge"
              status="busy"
            />
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
