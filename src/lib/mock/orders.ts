import type { Order } from "./types";

export const orders: Order[] = [
  {
    id: "ord_1001", number: "#1001", customer: "Lindsey Curtis", email: "lindsey@nova-labs.io", date: "2025-09-02T14:12:00",
    items: [{ name: 'MacBook Pro 14"', qty: 1, price: 1999 }, { name: "Magic Keyboard", qty: 1, price: 149 }],
    total: 2148, payment: "Card", fulfillment: "Fulfilled", status: "Paid",
  },
  {
    id: "ord_1002", number: "#1002", customer: "Kaiya George", email: "kaiya@brightsend.co", date: "2025-09-02T11:40:00",
    items: [{ name: "iPhone 15 Pro Max", qty: 2, price: 1199 }],
    total: 2398, payment: "PayPal", fulfillment: "Unfulfilled", status: "Pending",
  },
  {
    id: "ord_1003", number: "#1003", customer: "Zain Geidt", email: "zain@peakflow.dev", date: "2025-09-01T18:05:00",
    items: [{ name: "AirPods Pro (2nd gen)", qty: 1, price: 249 }],
    total: 249, payment: "Card", fulfillment: "Fulfilled", status: "Paid",
  },
  {
    id: "ord_1004", number: "#1004", customer: "Abram Schleifer", email: "abram@lumen.works", date: "2025-09-01T09:22:00",
    items: [{ name: "Apple Watch Ultra 2", qty: 1, price: 799 }, { name: "USB-C Charge Cable", qty: 2, price: 29 }],
    total: 857, payment: "Bank transfer", fulfillment: "Partially fulfilled", status: "Paid",
  },
  {
    id: "ord_1005", number: "#1005", customer: "Carla George", email: "carla@finchr.com", date: "2025-08-31T16:48:00",
    items: [{ name: 'iPad Pro 12.9"', qty: 1, price: 1099 }],
    total: 1099, payment: "Card", fulfillment: "Returned", status: "Refunded",
  },
  {
    id: "ord_1006", number: "#1006", customer: "Livia Bator", email: "livia@stackberry.co", date: "2025-08-31T10:15:00",
    items: [{ name: "HomePod mini", qty: 3, price: 99 }],
    total: 297, payment: "Wire", fulfillment: "Unfulfilled", status: "Cancelled",
  },
  {
    id: "ord_1007", number: "#1007", customer: "Randy Press", email: "randy@corewave.app", date: "2025-08-30T13:03:00",
    items: [{ name: "Magic Keyboard", qty: 4, price: 149 }],
    total: 596, payment: "Card", fulfillment: "Fulfilled", status: "Paid",
  },
];

export const orderById = (id: string) => orders.find((o) => o.id === id);
