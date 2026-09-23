"use client";

import { popularServices, type SalonScope } from "@/lib/mock/beautyandco";

// Restylé sur le Figma node 286:249 : bandeau titre + sous-titre + pastille
// « Tendances du mois », barres pleine largeur (pas de rang numéroté ni de
// compteur brut — juste le nom et le %, cf. mock). Données réelles inchangées
// (`popularServices(scope)`), seule la mise en forme change.
export default function PopularServices({ scope }: { scope: SalonScope }) {
  const { items } = popularServices(scope);

  return (
    <div className="rounded-xl border border-[#efe9e8] bg-white p-6 shadow-[0px_2px_8px_-2px_rgba(90,66,66,0.04),0px_1px_3px_0px_rgba(90,66,66,0.02)]">
      <div>
        <h3 className="text-[18px] font-semibold text-[#2d2626]">Prestations Populaires</h3>
        <p className="mt-0.5 text-[13px] text-[#6a6060]">
          Répartition des demandes sur les 30 derniers jours
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {items.map((service) => (
          <div key={service.name}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-semibold tracking-wide text-[#2d2626]">
                {service.name}
              </span>
              <span className="shrink-0 text-[12px] font-bold tracking-wide text-[#5a4242]">
                {service.share}&nbsp;%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#eee]">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${service.share}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
