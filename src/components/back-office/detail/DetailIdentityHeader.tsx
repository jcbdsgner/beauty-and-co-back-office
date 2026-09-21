import type { ReactNode } from "react";

// Bandeau d'identité des fiches en modal : avatar/pictogramme + nom + badges
// à gauche, grille d'informations clé à droite. Partagé entre la fiche
// cliente et la fiche rendez-vous.

export default function DetailIdentityHeader({
  avatar,
  name,
  subtitle,
  badges,
  fields,
}: {
  avatar: ReactNode;
  name: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-start gap-4">
        {avatar}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
            {badges}
          </div>
          {subtitle && <div className="mt-1 text-theme-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-theme-xs uppercase tracking-wide text-gray-400">{f.label}</dt>
            <dd className="mt-0.5 text-theme-sm font-medium text-gray-800">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DetailAvatar({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700 [&_svg]:h-6 [&_svg]:w-6">
      {children}
    </span>
  );
}
