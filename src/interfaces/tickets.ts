/**
 * src/api/tickets.ts

  GET tickets/list — params: status/product/company/assignee/priority filters, returns Ticket[]
  GET tickets/get — params: id, returns one Ticket + its TicketMessage[] + TicketAttachment[]
  POST tickets/create — subject, company, product, opened_by, initial message
  PUT tickets/update_status — id, status
  PUT tickets/update_priority — id, priority
  PUT tickets/update_due_date — id, due_date
  PUT tickets/assign — id, assignee_id (null to unassign)
  POST tickets/reply — id, body, is_internal_note
  POST tickets/attachment — id, message_id?, file (multipart)

  src/api/ticketConfigs.ts — list/create/update/delete for TicketConfig
  src/api/ticketTemplates.ts — list/create/update/delete for TicketTemplate
  src/api/ticketApiKeys.ts — list/create/revoke for ApiKey (no update — keys are immutable once issued)
  src/api/ticketDocs.ts — list/create/update/delete for TicketDoc
 */

// Actual interfaces for tickets, ticket messages, attachments, configs, templates, api keys, and docs. 
interface Ticket {
  id: number;
  subject: string;
  status: "open" | "closed" | "pending";
  priority: "low" | "normal" | "high";
  company: number;
  company_name: string;
  product: string;
  assignee_id: number | null;
  opened_by: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface TicketMsg {
  id: number;
  ticket_id: number;
  author_id: number;
  body: string;
  is_internal_note: boolean;
  created_at: string;
}

interface TicketAttachment {
  id: number;
  ticket_id: number;
  message_id: number | null;
  filename: string;
  url: string;
  size_bytes: number;
  uploaded_at: string;
}

interface TicketConfig {
  id: number;
  name: string;
  match: { company?: number; product?: string };
  action: { auto_assignee_id?: number; default_priority?: Ticket["priority"] };
}

interface TicketTemplate {
  id: number;
  name: string;
  body: string;
}

interface ApiKey {
  id: number;
  label: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
}

interface TicketDoc {
  id: number;
  title: string;
  body: string;
  updated_at: string;
}

// Interfaces for API responses that wrap the above entities. These are used in the API functions to type the responses.
// Backend not implemented yet

export type {
  Ticket,
  TicketMsg,
  TicketAttachment,
  TicketConfig,
  TicketTemplate,
  ApiKey,
  TicketDoc,
};
