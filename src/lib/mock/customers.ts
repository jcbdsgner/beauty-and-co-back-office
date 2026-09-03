import type { Customer } from "./types";

export const customers: Customer[] = [
  { id: "cus_01", name: "Lindsey Curtis", email: "lindsey@nova-labs.io", company: "Nova Labs", country: "United States", plan: "Pro", status: "Active", mrr: 249, createdAt: "2024-11-02", lastSeen: "2025-09-02", avatar: "/images/avatar.png" },
  { id: "cus_02", name: "Kaiya George", email: "kaiya@brightsend.co", company: "BrightSend", country: "United Kingdom", plan: "Enterprise", status: "Active", mrr: 1450, createdAt: "2023-06-18", lastSeen: "2025-09-01", avatar: "/images/avatar.png" },
  { id: "cus_03", name: "Zain Geidt", email: "zain@peakflow.dev", company: "Peakflow", country: "Germany", plan: "Starter", status: "Trialing", mrr: 0, createdAt: "2025-08-21", lastSeen: "2025-08-30", avatar: "/images/avatar.png" },
  { id: "cus_04", name: "Abram Schleifer", email: "abram@lumen.works", company: "Lumen Works", country: "Canada", plan: "Pro", status: "Past due", mrr: 249, createdAt: "2024-02-11", lastSeen: "2025-08-12", avatar: "/images/avatar.png" },
  { id: "cus_05", name: "Carla George", email: "carla@finchr.com", company: "Finchr", country: "Australia", plan: "Starter", status: "Active", mrr: 49, createdAt: "2025-01-09", lastSeen: "2025-09-02", avatar: "/images/avatar.png" },
  { id: "cus_06", name: "Emery Culhane", email: "emery@groundline.io", company: "Groundline", country: "United States", plan: "Free", status: "Churned", mrr: 0, createdAt: "2024-09-30", lastSeen: "2025-05-04", avatar: "/images/avatar.png" },
  { id: "cus_07", name: "Livia Bator", email: "livia@stackberry.co", company: "Stackberry", country: "France", plan: "Enterprise", status: "Active", mrr: 1900, createdAt: "2022-12-01", lastSeen: "2025-09-03", avatar: "/images/avatar.png" },
  { id: "cus_08", name: "Randy Press", email: "randy@corewave.app", company: "Corewave", country: "Netherlands", plan: "Pro", status: "Active", mrr: 249, createdAt: "2024-07-14", lastSeen: "2025-08-29", avatar: "/images/avatar.png" },
  { id: "cus_09", name: "Miriam Soleil", email: "miriam@northpeak.io", company: "Northpeak", country: "Spain", plan: "Starter", status: "Trialing", mrr: 0, createdAt: "2025-08-27", lastSeen: "2025-09-01", avatar: "/images/avatar.png" },
  { id: "cus_10", name: "Wilson Gouse", email: "wilson@aeronim.com", company: "Aeronim", country: "United States", plan: "Pro", status: "Active", mrr: 498, createdAt: "2023-03-22", lastSeen: "2025-09-02", avatar: "/images/avatar.png" },
];

export const customerName = (id: string) =>
  customers.find((c) => c.id === id)?.name ?? "Unknown customer";
