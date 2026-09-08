import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function PageHeader({ title, description, backHref, backLabel }: Props) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-theme-sm text-gray-500 hover:text-gray-700"
        >
          ← {backLabel ?? "Retour"}
        </Link>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-theme-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}
