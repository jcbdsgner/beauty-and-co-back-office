import { ServicesDataProvider } from "@/components/back-office/services/ServicesData";

// Porte l'état de session du catalogue au-dessus des deux onglets-routes
// (`/services` Prestations, `/services/boissons` Boissons).
export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <ServicesDataProvider>{children}</ServicesDataProvider>;
}
