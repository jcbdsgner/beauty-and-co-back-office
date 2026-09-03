import type { ActivityEntry, Notification, Integration, ApiKey } from "./types";

export const activity: ActivityEntry[] = [
  { id: "act_01", date: "2025-09-03T08:12:00", actor: "Alexandra Reed", action: "Signed in", target: "Web · Chrome on macOS", ip: "84.21.10.5" },
  { id: "act_02", date: "2025-09-02T19:45:00", actor: "Marcus Lin", action: "Updated product", target: 'MacBook Pro 14" — price $1,899 → $1,999', ip: "84.21.60.11" },
  { id: "act_03", date: "2025-09-02T16:30:00", actor: "Tom Becker", action: "Exported report", target: "Monthly revenue summary (PDF)", ip: "196.1.95.20" },
  { id: "act_04", date: "2025-09-02T11:02:00", actor: "Priya Nair", action: "Resolved ticket", target: "#tkt_03 — How do I add a teammate?", ip: "84.21.60.33" },
  { id: "act_05", date: "2025-09-01T09:15:00", actor: "Alexandra Reed", action: "Invited member", target: "sofia@homonyme.app as Support", ip: "84.21.10.5" },
  { id: "act_06", date: "2025-08-31T14:20:00", actor: "System", action: "Payout sent", target: "$18,420 to bank account ····4021", ip: "—" },
];

export const notifications: Notification[] = [
  { id: "ntf_01", title: "Payment failed", body: "Wilson Gouse's card was declined for $498.", date: "2025-09-03T09:02:00", read: false, tone: "error" },
  { id: "ntf_02", title: "New enterprise trial", body: "Northpeak started an Enterprise trial.", date: "2025-09-01T10:00:00", read: false, tone: "info" },
  { id: "ntf_03", title: "Low stock", body: "iPhone 15 Pro Max is down to 7 units.", date: "2025-08-30T08:00:00", read: true, tone: "warning" },
  { id: "ntf_04", title: "Payout completed", body: "$18,420 landed in your bank account.", date: "2025-08-29T06:05:00", read: true, tone: "success" },
];

export const integrations: Integration[] = [
  { id: "int_stripe", name: "Stripe", category: "Payments", connected: true, description: "Charges, refunds and payouts" },
  { id: "int_slack", name: "Slack", category: "Notifications", connected: true, description: "Send alerts to a channel" },
  { id: "int_hubspot", name: "HubSpot", category: "CRM", connected: false, description: "Sync customers and deals" },
  { id: "int_ga", name: "Google Analytics", category: "Analytics", connected: true, description: "Traffic and conversion data" },
  { id: "int_zapier", name: "Zapier", category: "Automation", connected: false, description: "Connect to 6,000+ apps" },
  { id: "int_shopify", name: "Shopify", category: "Commerce", connected: false, description: "Import orders and inventory" },
];

export const apiKeys: ApiKey[] = [
  { id: "key_01", label: "Production server", prefix: "hk_live_9f2a", created: "2024-11-02", lastUsed: "2025-09-03", scope: "Read/Write" },
  { id: "key_02", label: "Analytics pipeline", prefix: "hk_live_3b71", created: "2025-02-18", lastUsed: "2025-09-02", scope: "Read" },
  { id: "key_03", label: "Local development", prefix: "hk_test_c0d4", created: "2025-06-30", lastUsed: "2025-08-21", scope: "Admin" },
];
