import type { Metadata } from "next";
import React from "react";
import Shell from "./Shell";

export const metadata: Metadata = {
  title: "Design system | Homonyme",
  description: "Component and token reference for the Homonyme back office.",
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
