import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Ticket,
  TicketMsg,
  TicketAttachment,
  TicketConfig,
  TicketTemplate,
  ApiKey,
  TicketDoc,
} from "./interfaces";
import {
  MOCK_TICKETS,
  MOCK_MESSAGES,
  MOCK_ATTACHMENTS,
  MOCK_CONFIGS,
  MOCK_TEMPLATES,
  MOCK_API_KEYS,
  MOCK_DOCS,
  MOCK_STAFF,
  type MockStaffUser,
} from "./mockData";

export type TicketsTab =
  | "tickets"
  | "history"
  | "configs"
  | "templates"
  | "apiKeys"
  | "docs";

export type QuickFilter = "all" | "unassigned" | "mine" | "urgent";

interface TicketsState {
  activeTab: TicketsTab;

  tickets: Ticket[];
  messages: TicketMsg[];
  attachments: TicketAttachment[];
  configs: TicketConfig[];
  templates: TicketTemplate[];
  apiKeys: ApiKey[];
  docs: TicketDoc[];
  staff: MockStaffUser[];

  // Tickets tab — filters live here (not local useState) so they survive
  // switching tabs/navigating away and back, same reasoning as Organization's
  // usersGridFilters.
  selectedTicketId: number | null;
  quickFilter: QuickFilter;
  searchText: string;
  statusFilter: "" | Ticket["status"];
  companyFilter: number | "";
  replyDraft: string;
  replyIsInternal: boolean;

  // History tab
  historyCompanyFilter: number | "";

  // List search text for the simpler CRUD tabs
  configSearchText: string;
  templateSearchText: string;
  docSearchText: string;
}

const initialState: TicketsState = {
  activeTab: "tickets",

  tickets: MOCK_TICKETS,
  messages: MOCK_MESSAGES,
  attachments: MOCK_ATTACHMENTS,
  configs: MOCK_CONFIGS,
  templates: MOCK_TEMPLATES,
  apiKeys: MOCK_API_KEYS,
  docs: MOCK_DOCS,
  staff: MOCK_STAFF,

  selectedTicketId: null,
  quickFilter: "all",
  searchText: "",
  statusFilter: "",
  companyFilter: "",
  replyDraft: "",
  replyIsInternal: false,

  historyCompanyFilter: "",

  configSearchText: "",
  templateSearchText: "",
  docSearchText: "",
};

const nextId = (rows: { id: number }[]) =>
  rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TicketsTab>) => {
      state.activeTab = action.payload;
    },
    setSelectedTicketId: (state, action: PayloadAction<number | null>) => {
      state.selectedTicketId = action.payload;
      state.replyDraft = "";
      state.replyIsInternal = false;
    },
    setQuickFilter: (state, action: PayloadAction<QuickFilter>) => {
      state.quickFilter = action.payload;
    },
    setSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<"" | Ticket["status"]>) => {
      state.statusFilter = action.payload;
    },
    setCompanyFilter: (state, action: PayloadAction<number | "">) => {
      state.companyFilter = action.payload;
    },
    setReplyDraft: (state, action: PayloadAction<string>) => {
      state.replyDraft = action.payload;
    },
    setReplyIsInternal: (state, action: PayloadAction<boolean>) => {
      state.replyIsInternal = action.payload;
    },
    setHistoryCompanyFilter: (state, action: PayloadAction<number | "">) => {
      state.historyCompanyFilter = action.payload;
    },
    setConfigSearchText: (state, action: PayloadAction<string>) => {
      state.configSearchText = action.payload;
    },
    setTemplateSearchText: (state, action: PayloadAction<string>) => {
      state.templateSearchText = action.payload;
    },
    setDocSearchText: (state, action: PayloadAction<string>) => {
      state.docSearchText = action.payload;
    },

    createTicket: (
      state,
      action: PayloadAction<{
        subject: string;
        company: number;
        company_name: string;
        product: string;
        priority: Ticket["priority"];
        opened_by: number;
        body: string;
      }>,
    ) => {
      const now = action.payload;
      const id = nextId(state.tickets);
      const created_at = new Date().toISOString();
      const ticket: Ticket = {
        id,
        subject: now.subject,
        status: "open",
        priority: now.priority,
        company: now.company,
        company_name: now.company_name,
        product: now.product,
        assignee_id: null,
        opened_by: now.opened_by,
        created_at,
        updated_at: created_at,
        closed_at: null,
      };
      state.tickets.unshift(ticket);
      state.messages.push({
        id: nextId(state.messages),
        ticket_id: id,
        author_id: now.opened_by,
        body: now.body,
        is_internal_note: false,
        created_at,
      });
    },
    updateTicketStatus: (
      state,
      action: PayloadAction<{ id: number; status: Ticket["status"] }>,
    ) => {
      const ticket = state.tickets.find((t) => t.id === action.payload.id);
      if (!ticket) return;
      ticket.status = action.payload.status;
      const now = new Date().toISOString();
      ticket.updated_at = now;
      ticket.closed_at = action.payload.status === "closed" ? now : null;
    },
    updateTicketPriority: (
      state,
      action: PayloadAction<{ id: number; priority: Ticket["priority"] }>,
    ) => {
      const ticket = state.tickets.find((t) => t.id === action.payload.id);
      if (!ticket) return;
      ticket.priority = action.payload.priority;
      ticket.updated_at = new Date().toISOString();
    },
    assignTicket: (
      state,
      action: PayloadAction<{ id: number; assignee_id: number | null }>,
    ) => {
      const ticket = state.tickets.find((t) => t.id === action.payload.id);
      if (!ticket) return;
      ticket.assignee_id = action.payload.assignee_id;
      ticket.updated_at = new Date().toISOString();
    },
    addMessage: (
      state,
      action: PayloadAction<{
        ticket_id: number;
        author_id: number;
        body: string;
        is_internal_note: boolean;
      }>,
    ) => {
      const now = new Date().toISOString();
      state.messages.push({
        id: nextId(state.messages),
        ...action.payload,
        created_at: now,
      });
      const ticket = state.tickets.find(
        (t) => t.id === action.payload.ticket_id,
      );
      if (ticket) ticket.updated_at = now;
      state.replyDraft = "";
      state.replyIsInternal = false;
    },

    addConfig: (
      state,
      action: PayloadAction<Omit<TicketConfig, "id">>,
    ) => {
      state.configs.push({ id: nextId(state.configs), ...action.payload });
    },
    deleteConfig: (state, action: PayloadAction<number>) => {
      state.configs = state.configs.filter((c) => c.id !== action.payload);
    },

    addTemplate: (
      state,
      action: PayloadAction<Omit<TicketTemplate, "id">>,
    ) => {
      state.templates.push({ id: nextId(state.templates), ...action.payload });
    },
    deleteTemplate: (state, action: PayloadAction<number>) => {
      state.templates = state.templates.filter((t) => t.id !== action.payload);
    },

    addApiKey: (state, action: PayloadAction<{ label: string }>) => {
      state.apiKeys.push({
        id: nextId(state.apiKeys),
        label: action.payload.label,
        key_prefix: `tk_live_${Math.random().toString(36).slice(2, 6)}`,
        created_at: new Date().toISOString(),
        last_used_at: null,
        revoked: false,
      });
    },
    revokeApiKey: (state, action: PayloadAction<number>) => {
      const key = state.apiKeys.find((k) => k.id === action.payload);
      if (key) key.revoked = true;
    },

    addDoc: (state, action: PayloadAction<Omit<TicketDoc, "id" | "updated_at">>) => {
      state.docs.push({
        id: nextId(state.docs),
        ...action.payload,
        updated_at: new Date().toISOString(),
      });
    },
    deleteDoc: (state, action: PayloadAction<number>) => {
      state.docs = state.docs.filter((d) => d.id !== action.payload);
    },

    resetTicketsState: () => initialState,
  },
});

export const {
  setActiveTab,
  setSelectedTicketId,
  setQuickFilter,
  setSearchText,
  setStatusFilter,
  setCompanyFilter,
  setReplyDraft,
  setReplyIsInternal,
  setHistoryCompanyFilter,
  setConfigSearchText,
  setTemplateSearchText,
  setDocSearchText,
  createTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  addMessage,
  addConfig,
  deleteConfig,
  addTemplate,
  deleteTemplate,
  addApiKey,
  revokeApiKey,
  addDoc,
  deleteDoc,
  resetTicketsState,
} = ticketsSlice.actions;
export default ticketsSlice.reducer;
