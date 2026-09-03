// Barrel for the mock data layer.
// Front-end only — no API, no persistence. Import from "@/lib/mock".

export * from "./types";
export * from "./customers";
export * from "./products";
export * from "./orders";
export * from "./finance";
export * from "./team";
export * from "./analytics";
export * from "./system";

export const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const shortDate = (iso: string) =>
  iso === "—" || !iso ? "—" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));

export const dateTime = (iso: string) =>
  iso === "—" || !iso ? "—" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
