"use client";

import { Sparkles } from "lucide-react";
import { groupThousands, popularServices, type SalonScope } from "@/lib/mock/beautyandco";

export default function PopularServices({ scope }: { scope: SalonScope }) {
  const { total, caption, items } = popularServices(scope);
  const max = Math.max(...items.map((s) => s.count));

  return (
    <div className="h-full rounded-2xl border border-gray-100 bg-white px-5 pt-5 pb-6 shadow-[var(--shadow-card)] sm:px-6 sm:pt-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
          <Sparkles className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Prestations populaires</h3>
          <p className="mt-1 text-theme-sm text-gray-500">
            {groupThousands(total)} {caption}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {items.map((service, i) => (
          <div key={service.name}>
            <div className="flex items-center gap-3 text-theme-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              <span className="flex-1 truncate font-medium text-gray-700">{service.name}</span>
              <span className="shrink-0 text-gray-500">
                {service.count}
                <span className="ml-1 text-gray-400">({service.share} %)</span>
              </span>
            </div>
            <div className="mt-2 ml-9 h-2 w-[calc(100%-2.25rem)] rounded-full bg-brand-50">
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
