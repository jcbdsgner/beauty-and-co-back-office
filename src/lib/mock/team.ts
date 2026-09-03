import type { TeamMember, Role, Ticket } from "./types";

export const team: TeamMember[] = [
  { id: "tm_01", name: "Alexandra Reed", email: "alex@homonyme.app", role: "Owner", team: "Leadership", status: "Active", lastActive: "2025-09-03T08:10:00", avatar: "/images/avatar.png" },
  { id: "tm_02", name: "Marcus Lin", email: "marcus@homonyme.app", role: "Admin", team: "Product", status: "Active", lastActive: "2025-09-02T19:40:00", avatar: "/images/avatar.png" },
  { id: "tm_03", name: "Priya Nair", email: "priya@homonyme.app", role: "Editor", team: "Growth", status: "Active", lastActive: "2025-09-02T17:05:00", avatar: "/images/avatar.png" },
  { id: "tm_04", name: "Tom Becker", email: "tom@homonyme.app", role: "Analyst", team: "Finance", status: "Active", lastActive: "2025-09-01T14:22:00", avatar: "/images/avatar.png" },
  { id: "tm_05", name: "Sofia Marchetti", email: "sofia@homonyme.app", role: "Support", team: "Support", status: "Invited", lastActive: "—", avatar: "/images/avatar.png" },
  { id: "tm_06", name: "Daniel Osei", email: "daniel@homonyme.app", role: "Editor", team: "Product", status: "Suspended", lastActive: "2025-07-18T10:00:00", avatar: "/images/avatar.png" },
];

export const roles: Role[] = [
  { id: "role_owner", name: "Owner", description: "Full access to everything, including billing and workspace deletion", members: 1, permissions: ["*"] },
  { id: "role_admin", name: "Admin", description: "Manage members, products, orders and settings; no billing control", members: 1, permissions: ["members:*", "catalog:*", "orders:*", "settings:write"] },
  { id: "role_editor", name: "Editor", description: "Create and edit content, products and campaigns", members: 2, permissions: ["catalog:write", "content:write", "orders:read"] },
  { id: "role_analyst", name: "Analyst", description: "Read-only access to analytics, reports and exports", members: 1, permissions: ["analytics:read", "reports:*"] },
  { id: "role_support", name: "Support", description: "Handle tickets and view customer records", members: 1, permissions: ["tickets:*", "customers:read"] },
];

export const tickets: Ticket[] = [
  { id: "tkt_01", subject: "Cannot download my invoice", requester: "Abram Schleifer", channel: "Email", priority: "Normal", status: "Open", assignee: "Sofia Marchetti", updatedAt: "2025-09-03T07:55:00" },
  { id: "tkt_02", subject: "Refund not received after 5 days", requester: "Carla George", channel: "Chat", priority: "High", status: "Pending", assignee: "Sofia Marchetti", updatedAt: "2025-09-02T16:30:00" },
  { id: "tkt_03", subject: "How do I add a teammate?", requester: "Zain Geidt", channel: "Chat", priority: "Low", status: "Solved", assignee: "Priya Nair", updatedAt: "2025-09-02T10:12:00" },
  { id: "tkt_04", subject: "API returning 401 on valid key", requester: "Wilson Gouse", channel: "Email", priority: "Urgent", status: "Open", assignee: "Marcus Lin", updatedAt: "2025-09-03T09:02:00" },
  { id: "tkt_05", subject: "Feature request: bulk export", requester: "Livia Bator", channel: "Email", priority: "Low", status: "Closed", assignee: "Priya Nair", updatedAt: "2025-08-28T13:20:00" },
];

export const teamMemberById = (id: string) => team.find((m) => m.id === id);
export const ticketById = (id: string) => tickets.find((t) => t.id === id);
