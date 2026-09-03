import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: { label: string; href?: string };
};

export default function PageHeader({ title, description, backHref, backLabel, action }: Props) {
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-theme-sm text-gray-500">{description}</p>
          )}
        </div>
        {action && (
          <span className="inline-flex cursor-default items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white opacity-90">
            {action.label}
          </span>
        )}
      </div>
    </div>
  );
}
