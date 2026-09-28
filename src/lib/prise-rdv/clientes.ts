import {
  ETHNICITY_OPTIONS,
  type ClientEthnicity,
  type ClientRow,
} from "@/lib/mock/beautyandco";

/**
 * La cliente telle que le parcours de prise de rendez-vous (recopié de point-de-vente) la lit —
 * `lib/data/types.ts::Cliente` là-bas, réduit aux champs dont le parcours se sert. Construite à
 * partir d'une ligne de la clientèle du back-office (`ClientsContext.rows`).
 */
export type Cliente = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  /** Le numéro cliente (« N° 1042 »), code fidélité côté point-de-vente. */
  loyaltyCode: string;
};

export type Ethnicity = ClientEthnicity;
export { ETHNICITY_OPTIONS };

export const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function clientFullName(c: Cliente) {
  return `${c.firstName} ${c.lastName}`.trim();
}

/** Jour + mois → « MM-JJ ». */
export function toBirthday(day: number, month: number): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function toCliente(row: ClientRow): Cliente {
  const [firstName, ...rest] = row.name.trim().split(/\s+/);
  return {
    id: row.id,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    phone: row.phone,
    email: row.email || undefined,
    loyaltyCode: String(row.number),
  };
}
