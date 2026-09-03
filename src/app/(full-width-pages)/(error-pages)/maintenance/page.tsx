import GridShape from "@/components/common/GridShape";
import { Metadata } from "next";
import Image from "next/image";
import React from "react";

export const metadata: Metadata = {
  title: "Maintenance | Homonyme",
  description: "The dashboard is temporarily unavailable.",
};

export default function Maintenance() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
          MAINTENANCE
        </h1>
        <Image src="/images/error/maintenance.svg" alt="maintenance" className="dark:hidden" width={472} height={152} />
        <Image src="/images/error/maintenance-dark.svg" alt="maintenance" className="hidden dark:block" width={472} height={152} />
        <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
          We&apos;re making things better. The dashboard will be back shortly.
        </p>
      </div>
      <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - Homonyme
      </p>
    </div>
  );
}
