import React from "react";

export function FormCard({
  title,
  description,
  children,
  footer = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: boolean;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
        {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <div className="space-y-5 p-6">{children}</div>
      {footer && (
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button className="cursor-default rounded-lg px-4 py-2 text-theme-sm font-medium text-gray-600 dark:text-gray-300">
            Cancel
          </button>
          <button className="cursor-default rounded-lg bg-brand-500 px-4 py-2 text-theme-sm font-medium text-white opacity-90">
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

export function ToggleRow({
  label,
  description,
  on = false,
}: {
  label: string;
  description?: string;
  on?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{label}</p>
        {description && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          on ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </div>
  );
}
