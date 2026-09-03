import React from "react";

export default function DefinitionList({
  title,
  items,
}: {
  title?: string;
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {title && (
        <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
      )}
      <dl className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 py-3 text-theme-sm">
            <dt className="text-gray-500 dark:text-gray-400">{item.label}</dt>
            <dd className="text-end font-medium text-gray-800 dark:text-white/90">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
