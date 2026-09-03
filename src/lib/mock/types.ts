// Shared types for the mock data layer.
// This is a front-end-only project: every value below is in-memory fixture data,
// there is no API and no database behind it.

export type ID = string;

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

export type Kpi = {
  key: string;
  label: string;
  value: string;
  delta?: number; // percentage vs previous period; omit for a value with no comparison
  direction: "up" | "down" | "flat"; // "flat" = no meaningful change to signal
  hint?: string;
};

export type SeriesPoint = { label: string; value: number };

export type Customer = {
  id: ID;
  name: string;
  email: string;
  company: string;
  country: string;
  plan: "Free" | "Starter" | "Pro" | "Enterprise";
  status: "Active" | "Trialing" | "Past due" | "Churned";
  mrr: number; // USD
  createdAt: string; // ISO date
  lastSeen: string; // ISO date
  avatar: string;
};

export type Product = {
  id: ID;
  name: string;
  sku: string;
  category: string;
  price: number; // USD
  stock: number;
  status: "Published" | "Draft" | "Archived";
  updatedAt: string; // ISO date
  image: string;
};

export type Category = {
  id: ID;
  name: string;
  slug: string;
  products: number;
  description: string;
};

export type OrderItem = { name: string; qty: number; price: number };

export type Order = {
  id: ID;
  number: string;
  customer: string;
  email: string;
  date: string; // ISO datetime
  items: OrderItem[];
  total: number; // USD
  payment: "Card" | "PayPal" | "Bank transfer" | "Wire";
  fulfillment: "Unfulfilled" | "Fulfilled" | "Partially fulfilled" | "Returned";
  status: "Paid" | "Pending" | "Refunded" | "Cancelled";
};

export type Transaction = {
  id: ID;
  reference: string;
  date: string; // ISO datetime
  customer: string;
  method: "Card" | "PayPal" | "Bank transfer" | "Wire";
  amount: number; // USD, negative for refunds/payouts
  type: "Charge" | "Refund" | "Payout" | "Adjustment";
  status: "Succeeded" | "Processing" | "Failed";
};

export type Invoice = {
  id: ID;
  number: string;
  customer: string;
  issued: string; // ISO date
  due: string; // ISO date
  amount: number; // USD
  status: "Paid" | "Open" | "Overdue" | "Draft";
};

export type TeamMember = {
  id: ID;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Analyst" | "Support";
  team: "Product" | "Growth" | "Finance" | "Support" | "Leadership";
  status: "Active" | "Invited" | "Suspended";
  lastActive: string; // ISO datetime
  avatar: string;
};

export type Role = {
  id: ID;
  name: string;
  description: string;
  members: number;
  permissions: string[];
};

export type Ticket = {
  id: ID;
  subject: string;
  requester: string;
  channel: "Email" | "Chat" | "Phone";
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Open" | "Pending" | "Solved" | "Closed";
  assignee: string;
  updatedAt: string; // ISO datetime
};

export type ActivityEntry = {
  id: ID;
  date: string; // ISO datetime
  actor: string;
  action: string;
  target: string;
  ip: string;
};

export type Report = {
  id: ID;
  name: string;
  description: string;
  category: "Revenue" | "Customers" | "Operations" | "Marketing";
  lastRun: string; // ISO date
  format: "CSV" | "PDF" | "XLSX";
};

export type Notification = {
  id: ID;
  title: string;
  body: string;
  date: string; // ISO datetime
  read: boolean;
  tone: StatusTone;
};

export type Integration = {
  id: ID;
  name: string;
  category: string;
  connected: boolean;
  description: string;
};

export type ApiKey = {
  id: ID;
  label: string;
  prefix: string;
  created: string; // ISO date
  lastUsed: string; // ISO date
  scope: "Read" | "Read/Write" | "Admin";
};
