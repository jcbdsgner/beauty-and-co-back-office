import { EquipeDataProvider } from "@/components/back-office/equipe/EquipeData";

// Porte l'état de session d'Équipe au-dessus des onglets-routes (`/equipe`
// Membres, `/equipe/planning` Planning, `/equipe/pointage` Pointage), pour
// qu'il survive au passage de l'un à l'autre.
export default function EquipeLayout({ children }: { children: React.ReactNode }) {
  return <EquipeDataProvider>{children}</EquipeDataProvider>;
}
