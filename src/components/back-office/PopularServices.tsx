"use client";

import { groupThousands, popularServices, type SalonScope } from "@/lib/mock/beautyandco";

export default function PopularServices({ scope }: { scope: SalonScope }) {
  const { total, caption, items } = popularServices(scope);
  const max = Math.max(...items.map((s) => s.count));

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white px-5 pt-5 pb-6 sm:px-6 sm:pt-6">
      <h3 className="text-lg font-semibold text-gray-800">Prestations populaires</h3>
      <p className="mt-1 text-theme-sm text-gray-500">
        {groupThousands(total)} {caption}
      </p>

      <div className="mt-6 space-y-5">
        {items.map((service) => (
          <div key={service.name}>
            <div className="flex items-center justify-between text-theme-sm">
              <span className="font-medium text-gray-700">{service.name}</span>
              <span className="text-gray-500">
                {service.count}
                <span className="ml-1 text-gray-400">({service.share} %)</span>
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-500"
                style={{ width: `${Math.round((service.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
