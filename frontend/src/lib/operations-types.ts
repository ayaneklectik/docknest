export const projectStatuses = [
  "inquiry",
  "quotation_sent",
  "awaiting_payment",
  "confirmed",
  "in_progress",
  "review",
  "completed",
  "cancelled"
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const ticketStatuses = [
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed"
] as const;
export type TicketStatus = (typeof ticketStatuses)[number];
export const ticketPriorities = ["low", "normal", "high", "urgent"] as const;
export type TicketPriority = (typeof ticketPriorities)[number];

export type ProjectRecord = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  title: string;
  description: string;
  status: ProjectStatus;
  due_at: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketRecord = {
  id: string;
  ticket_number: string;
  customer_id: string | null;
  name: string;
  email: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message: string | null;
};
