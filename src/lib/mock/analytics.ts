import type { Kpi, SeriesPoint, Report } from "./types";

export const dashboardKpis: Kpi[] = [
  { key: "mrr", label: "Monthly recurring revenue", value: "$48,210", delta: 12.4, direction: "up", hint: "vs. last month" },
  { key: "customers", label: "Active customers", value: "1,842", delta: 3.1, direction: "up", hint: "vs. last month" },
  { key: "orders", label: "Orders this month", value: "3,417", delta: 2.2, direction: "down", hint: "vs. last month" },
  { key: "churn", label: "Net churn", value: "1.8%", delta: 0.4, direction: "down", hint: "lower is better" },
];

export const analyticsKpis: Kpi[] = [
  { key: "sessions", label: "Sessions", value: "128,940", delta: 8.6, direction: "up" },
  { key: "conversion", label: "Conversion rate", value: "3.42%", delta: 0.3, direction: "up" },
  { key: "aov", label: "Average order value", value: "$186", delta: 1.1, direction: "down" },
  { key: "ltv", label: "Customer LTV", value: "$2,940", delta: 5.0, direction: "up" },
];

export const revenueByMonth: SeriesPoint[] = [
  { label: "Jan", value: 168 }, { label: "Feb", value: 385 }, { label: "Mar", value: 201 },
  { label: "Apr", value: 298 }, { label: "May", value: 187 }, { label: "Jun", value: 195 },
  { label: "Jul", value: 291 }, { label: "Aug", value: 110 }, { label: "Sep", value: 215 },
  { label: "Oct", value: 390 }, { label: "Nov", value: 280 }, { label: "Dec", value: 112 },
];

export const salesByChannel: SeriesPoint[] = [
  { label: "Direct", value: 44 }, { label: "Organic search", value: 28 },
  { label: "Paid ads", value: 16 }, { label: "Referral", value: 8 }, { label: "Email", value: 4 },
];

export const topCountries: SeriesPoint[] = [
  { label: "United States", value: 38 }, { label: "United Kingdom", value: 17 },
  { label: "Germany", value: 12 }, { label: "France", value: 9 },
  { label: "Canada", value: 7 }, { label: "Australia", value: 6 },
];

export const reports: Report[] = [
  { id: "rep_01", name: "Monthly revenue summary", description: "Gross revenue, refunds and net by product category", category: "Revenue", lastRun: "2025-09-01", format: "PDF" },
  { id: "rep_02", name: "Customer cohort retention", description: "Retention curves by signup month over 12 months", category: "Customers", lastRun: "2025-08-28", format: "XLSX" },
  { id: "rep_03", name: "Order fulfilment SLA", description: "Time-to-fulfil distribution and breaches", category: "Operations", lastRun: "2025-09-02", format: "CSV" },
  { id: "rep_04", name: "Campaign attribution", description: "Revenue attributed to marketing channels and campaigns", category: "Marketing", lastRun: "2025-08-30", format: "CSV" },
  { id: "rep_05", name: "Failed payments", description: "Declined charges with retry outcomes", category: "Revenue", lastRun: "2025-09-03", format: "CSV" },
];
