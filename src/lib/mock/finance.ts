import type { Transaction, Invoice } from "./types";

export const transactions: Transaction[] = [
  { id: "txn_01", reference: "ch_3Pq8...a1", date: "2025-09-02T14:12:30", customer: "Lindsey Curtis", method: "Card", amount: 2148, type: "Charge", status: "Succeeded" },
  { id: "txn_02", reference: "py_9Kd2...c7", date: "2025-09-02T11:40:10", customer: "Kaiya George", method: "PayPal", amount: 2398, type: "Charge", status: "Processing" },
  { id: "txn_03", reference: "ch_1Lm4...f0", date: "2025-09-01T18:05:44", customer: "Zain Geidt", method: "Card", amount: 249, type: "Charge", status: "Succeeded" },
  { id: "txn_04", reference: "rf_7Nb6...d3", date: "2025-08-31T17:02:00", customer: "Carla George", method: "Card", amount: -1099, type: "Refund", status: "Succeeded" },
  { id: "txn_05", reference: "po_2025_35", date: "2025-08-29T06:00:00", customer: "Homonyme payout", method: "Bank transfer", amount: -18420, type: "Payout", status: "Succeeded" },
  { id: "txn_06", reference: "ch_5Rt8...b9", date: "2025-08-28T09:31:12", customer: "Wilson Gouse", method: "Card", amount: 498, type: "Charge", status: "Failed" },
  { id: "txn_07", reference: "adj_00417", date: "2025-08-27T12:00:00", customer: "Abram Schleifer", method: "Card", amount: -40, type: "Adjustment", status: "Succeeded" },
];

export const invoices: Invoice[] = [
  { id: "inv_2043", number: "INV-2043", customer: "Nova Labs", issued: "2025-09-01", due: "2025-09-15", amount: 249, status: "Open" },
  { id: "inv_2042", number: "INV-2042", customer: "BrightSend", issued: "2025-09-01", due: "2025-09-15", amount: 1450, status: "Paid" },
  { id: "inv_2041", number: "INV-2041", customer: "Lumen Works", issued: "2025-08-01", due: "2025-08-15", amount: 249, status: "Overdue" },
  { id: "inv_2040", number: "INV-2040", customer: "Stackberry", issued: "2025-09-01", due: "2025-09-15", amount: 1900, status: "Paid" },
  { id: "inv_2039", number: "INV-2039", customer: "Corewave", issued: "2025-09-02", due: "2025-09-16", amount: 249, status: "Draft" },
  { id: "inv_2038", number: "INV-2038", customer: "Aeronim", issued: "2025-08-15", due: "2025-08-29", amount: 498, status: "Paid" },
];

export const transactionById = (id: string) => transactions.find((t) => t.id === id);
export const invoiceById = (id: string) => invoices.find((i) => i.id === id);
