import React from "react";

export default function DefinitionList({
  title,
  items,
}: {
  title?: string;
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="rounded-box border border-base-300 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      {title && (
        <h3 className="mb-4 text-base font-medium text-base-content dark:text-white/90">{title}</h3>
      )}
      <dl className="divide-y divide-base-300 dark:divide-gray-800">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-base-content/60 dark:text-base-content/45">{item.label}</dt>
            <dd className="text-end font-medium text-base-content dark:text-white/90">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
