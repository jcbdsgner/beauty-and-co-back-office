import GridShape from "@/components/common/GridShape";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 bg-white">
      <div className="flex h-screen w-full flex-col justify-center sm:flex-row">
        {children}

        {/* Panneau de marque — masqué sous les grands écrans (outil desktop) */}
        <div className="relative z-1 hidden h-full w-1/2 items-center bg-brand-950 lg:grid">
          <GridShape />
          <div className="relative z-1 mx-auto flex max-w-xs flex-col items-center">
            <Link href="/signin" className="mb-5 flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-700">
                B&amp;C
              </span>
              <span className="text-xl font-bold text-white">
                Beauty<span className="text-brand-200">AndCo</span>
              </span>
            </Link>
            <p className="text-center text-sm leading-relaxed text-white/60">
              Le back-office Beauty&nbsp;&amp;&nbsp;Co : rendez-vous, clientèle,
              équipe et encaissements de vos salons, au même endroit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
