import type { Metadata } from "next";
import Compte from "@/components/back-office/Compte";

export const metadata: Metadata = { title: "Mon compte | Homonyme" };

export default function ComptePage() {
  return <Compte />;
}
