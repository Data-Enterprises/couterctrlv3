import type {
  Ticket,
  TicketMsg,
  TicketAttachment,
  TicketConfig,
  TicketTemplate,
  ApiKey,
  TicketDoc,
} from "./interfaces";

// Stands in for real User records until a tickets backend exists — swap for
// a real staff/users fetch once ticket assignment can reference real accounts.
export interface MockStaffUser {
  id: number;
  name: string;
  email: string;
}

export const MOCK_STAFF: MockStaffUser[] = [
  { id: 47, name: "Tom Adair", email: "tadair@dcrpos.com" },
  { id: 517, name: "Stephen Nelson", email: "snelson@dcrpos.com" },
  { id: 3, name: "Amanda Benson", email: "abenson@houchens.com" },
];

// DCR is company id 5 in the real backend (see organization/baseGroups/BaseGroups.tsx's
// isDcrUser check) — kept consistent here. The rest are placeholder ids.
export const MOCK_COMPANIES: { id: number; name: string }[] = [
  { id: 5, name: "DCR" },
  { id: 12, name: "Houchens" },
  { id: 8, name: "Food Giant" },
  { id: 21, name: "Sonic" },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    subject: "Missing store data",
    status: "open",
    priority: "normal",
    company: 12,
    company_name: "Houchens",
    product: "CounterControl",
    assignee_id: null,
    opened_by: 1,
    created_at: "2026-07-27T14:47:48Z",
    updated_at: "2026-07-27T14:47:48Z",
    closed_at: null,
  },
  {
    id: 2,
    subject: "Refund not loading",
    status: "open",
    priority: "high",
    company: 21,
    company_name: "Sonic",
    product: "CounterControl",
    assignee_id: 47,
    opened_by: 2,
    created_at: "2026-07-14T09:10:00Z",
    updated_at: "2026-07-14T10:00:00Z",
    closed_at: null,
  },
  {
    id: 3,
    subject: "Testing ticket data",
    status: "pending",
    priority: "normal",
    company: 8,
    company_name: "Food Giant",
    product: "CounterControl",
    assignee_id: 517,
    opened_by: 3,
    created_at: "2026-07-13T11:00:00Z",
    updated_at: "2026-07-20T08:00:00Z",
    closed_at: null,
  },
  {
    id: 4,
    subject: "CSV export missing on Sub Margins",
    status: "closed",
    priority: "normal",
    company: 5,
    company_name: "DCR",
    product: "Internal",
    assignee_id: 517,
    opened_by: 517,
    created_at: "2026-07-08T09:00:00Z",
    updated_at: "2026-07-08T15:00:00Z",
    closed_at: "2026-07-08T15:00:00Z",
  },
  {
    id: 5,
    subject: "Login loop on tablet POS",
    status: "closed",
    priority: "high",
    company: 12,
    company_name: "Houchens",
    product: "CounterControl",
    assignee_id: 47,
    opened_by: 47,
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-03T12:00:00Z",
    closed_at: "2026-07-03T12:00:00Z",
  },
];

export const MOCK_MESSAGES: TicketMsg[] = [
  {
    id: 1,
    ticket_id: 1,
    author_id: 1,
    body: "Store 4522 hasn't reported sales data since yesterday morning.",
    is_internal_note: false,
    created_at: "2026-07-27T14:47:48Z",
  },
  {
    id: 2,
    ticket_id: 2,
    author_id: 2,
    body: "Refund button spins indefinitely on the Sonic tablet build.",
    is_internal_note: false,
    created_at: "2026-07-14T09:10:00Z",
  },
  {
    id: 3,
    ticket_id: 2,
    author_id: 1,
    body: "Checking the tablet app version now.",
    is_internal_note: true,
    created_at: "2026-07-14T10:00:00Z",
  },
  {
    id: 4,
    ticket_id: 4,
    author_id: 2,
    body: "The export button never appeared for Sub Dept Margins — turned out to be a stale devMode build on the client's machine.",
    is_internal_note: false,
    created_at: "2026-07-08T09:00:00Z",
  },
];

export const MOCK_ATTACHMENTS: TicketAttachment[] = [];

export const MOCK_CONFIGS: TicketConfig[] = [
  {
    id: 1,
    name: "Houchens intake",
    match: { company: 12 },
    action: { auto_assignee_id: 1 },
  },
  {
    id: 2,
    name: "Internal default priority",
    match: { company: 5 },
    action: { default_priority: "normal" },
  },
  {
    id: 3,
    name: "Sonic escalation",
    match: { company: 21 },
    action: { auto_assignee_id: 2 },
  },
];

export const MOCK_TEMPLATES: TicketTemplate[] = [
  {
    id: 1,
    name: "Ask for terminal serial number",
    body: "Could you confirm the serial number printed on the back of the terminal?",
  },
  {
    id: 2,
    name: "Restart POS terminal steps",
    body: "Please hold the power button for 10 seconds, then power back on and let us know if the issue persists.",
  },
  {
    id: 3,
    name: "Closing confirmation",
    body: "Marking this resolved — reply if you're still seeing the issue.",
  },
];

export const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 1,
    label: "Monitoring alerts",
    key_prefix: "tk_live_9c2f",
    created_at: "2026-06-02T00:00:00Z",
    last_used_at: "2026-07-27T12:00:00Z",
    revoked: false,
  },
  {
    id: 2,
    label: "Legacy integration",
    key_prefix: "tk_live_11ab",
    created_at: "2026-02-14T00:00:00Z",
    last_used_at: null,
    revoked: false,
  },
];

export const MOCK_DOCS: TicketDoc[] = [
  {
    id: 1,
    title: "Escalation SOP — payment failures",
    body: "1. Confirm the terminal is on the latest firmware...",
    updated_at: "2026-07-20T00:00:00Z",
  },
  {
    id: 2,
    title: "Store activation checklist",
    body: "1. Verify store record exists in Admin...",
    updated_at: "2026-07-11T00:00:00Z",
  },
];
