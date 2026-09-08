import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[472px] text-center">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl">
          Page introuvable
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="Erreur 404"
          width={472}
          height={152}
        />

        <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
