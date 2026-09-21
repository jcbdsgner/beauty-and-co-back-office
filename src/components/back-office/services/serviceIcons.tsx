import {
  ServiceCoiffureIcon,
  ServiceEpilationIcon,
  ServiceManucurePedicureIcon,
  ServiceMiniIcon,
  ServiceOnglerieIcon,
  ServiceSpaIcon,
  ServiceVisageIcon,
} from "@/icons";
import type { ServiceIconKey } from "@/lib/mock/services";

// Pictogrammes de catégorie repris du site vitrine b&co (mêmes icônes qu'à la
// réservation en ligne), à la place des émojis.
export const SERVICE_ICONS: Record<ServiceIconKey, React.ComponentType<{ className?: string }>> = {
  coiffure: ServiceCoiffureIcon,
  "manucure-pedicure": ServiceManucurePedicureIcon,
  onglerie: ServiceOnglerieIcon,
  spa: ServiceSpaIcon,
  visage: ServiceVisageIcon,
  epilation: ServiceEpilationIcon,
  mini: ServiceMiniIcon,
};
