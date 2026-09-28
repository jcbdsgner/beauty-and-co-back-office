import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function NotFound() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[472px] text-center">
        <h1 className="mb-8 text-title-md font-bold text-base-content xl:text-title-2xl">
          Page introuvable
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="Erreur 404"
          width={472}
          height={152}
        />

        <p className="mt-10 mb-6 text-base text-base-content/80 sm:text-lg">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>

        <Link
          href="/"
          className="btn btn-outline btn-sm normal-case text-[15px] font-semibold border-base-300 text-secondary hover:!bg-base-200 hover:!border-base-300 hover:!text-secondary active:scale-[0.97]"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
