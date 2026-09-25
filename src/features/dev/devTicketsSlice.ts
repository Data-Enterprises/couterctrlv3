import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  Ticket,
  TicketAssignee,
  TicketAttachment,
  TicketCaps,
  TicketComment,
  TicketLookups,
} from "../../api/tickets";

/**
 * The Client Help Desk.
 *
 * One page serving two views. Which one a person gets is not decided here and
 * not derived from their user level — it arrives with the data, as
 * `canViewAll` and `canManage` on every list and detail response. The page
 * reads those; nothing else is allowed to guess.
 */

/** All / Unassigned / Mine / Urgent, and the client's Open / Closed. Every
 *  one of them is a filter over rows already in hand. */
export type QueueTab = "all" | "unassigned" | "mine" | "urgent" | "closed";

export interface TicketsState {
  loading: boolean;
  error: string | null;
  tickets: Ticket[];
  caps: TicketCaps;
  lookups: TicketLookups | null;
  assignees: TicketAssignee[];

  /** The open ticket, its thread and its files. */
  selectedId: number | null;
  detail: Ticket | null;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  detailLoading: boolean;
  /**
   * The highest comment id already rendered — the whole of the polling
   * bookkeeping.
   *
   * Set when a ticket loads, when a poll brings comments, and when a reply is
   * posted. That last one matters: the POST hands back the comment, so it is
   * on screen immediately, and raising the mark is what stops the next poll
   * handing it back a second time.
   */
  lastCommentId: number;
  /**
   * A newer queue, fetched and deliberately not applied.
   *
   * The list sorts by updated_at, so refreshing it in place moves rows under
   * the hands of whoever is reaching for one. Held here and offered instead.
   */
  pending: Ticket[] | null;
  /** Set while a reply, an assign or a status change is in flight, so the
   *  thread cannot be double-posted. */
  working: boolean;

  tab: QueueTab;
  search: string;
  company: number | null;
  /**
   * The column filters, the same client-side pass the tabs make.
   *
   * Every field they read is already on the row, so a filter costs nothing
   * and the grid answers while someone is still reading down it.
   */
  filters: TicketFilters;

  newOpen: boolean;
  closingOpen: boolean;

  /**
   * Draw the client's view while holding a tech's token.
   *
   * Dev-only, and a preview of the LAYOUT only: the payload is still a tech's,
   * internal notes included, because the filtering happens in the query. It
   * exists because the page is level 9 and both flags trip at 8, so without it
   * the client view is a screen nobody on the team can look at. Proving the
   * filter needs a real non-tech account, not this.
   */
  asClient: boolean;
}

export interface TicketFilters {
  status: string[];
  priority: string[];
  title: string;
  company: string;
  openedBy: string;
  assignee: string;
}

export const noFilters: TicketFilters = {
  status: [],
  priority: [],
  title: "",
  company: "",
  openedBy: "",
  assignee: "",
};

export const initialState: TicketsState = {
  loading: false,
  error: null,
  tickets: [],
  caps: { canViewAll: false, canManage: false },
  lookups: null,
  assignees: [],
  selectedId: null,
  detail: null,
  comments: [],
  attachments: [],
  detailLoading: false,
  lastCommentId: 0,
  pending: null,
  working: false,
  tab: "all",
  search: "",
  company: null,
  filters: noFilters,
  newOpen: false,
  closingOpen: false,
  asClient: false,
};

const devTicketsSlice = createSlice({
  name: "devTickets",
  initialState,
  reducers: {
    startLoad: (state) => {
      state.loading = true;
      state.error = null;
    },
    setTickets: (
      state,
      action: PayloadAction<{ tickets: Ticket[]; caps: TicketCaps }>,
    ) => {
      state.loading = false;
      state.tickets = action.payload.tickets;
      state.caps = action.payload.caps;
    },
    failLoad: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setLookups: (state, action: PayloadAction<TicketLookups>) => {
      state.lookups = action.payload;
    },
    setAssignees: (state, action: PayloadAction<TicketAssignee[]>) => {
      state.assignees = action.payload;
    },

    selectTicket: (state, action: PayloadAction<number | null>) => {
      state.selectedId = action.payload;
      state.detailLoading = action.payload !== null;
      // A different ticket's ids mean nothing here.
      state.lastCommentId = 0;
      if (action.payload === null) {
        state.detail = null;
        state.comments = [];
        state.attachments = [];
      }
    },
    setDetail: (
      state,
      action: PayloadAction<{
        ticket: Ticket;
        comments: TicketComment[];
        attachments: TicketAttachment[];
        caps: TicketCaps;
      }>,
    ) => {
      state.detailLoading = false;
      state.detail = action.payload.ticket;
      state.comments = action.payload.comments;
      state.attachments = action.payload.attachments;
      state.lastCommentId = action.payload.comments.reduce(
        (high, c) => (c.id > high ? c.id : high),
        0,
      );
      // The detail carries the flags too, and it is the more recent answer.
      state.caps = action.payload.caps;
    },
    setAttachments: (state, action: PayloadAction<TicketAttachment[]>) => {
      state.attachments = action.payload;
    },
    failDetail: (state, action: PayloadAction<string>) => {
      state.detailLoading = false;
      state.error = action.payload;
    },

    startWork: (state) => {
      state.working = true;
      state.error = null;
    },
    endWork: (state) => {
      state.working = false;
    },
    /**
     * A ticket that has just changed, from whichever endpoint returned it.
     *
     * The list row is replaced in place rather than refetched, and moved to
     * the front, because the list is ordered by updated_at and anything that
     * returns a ticket has just bumped it.
     */
    upsertTicket: (state, action: PayloadAction<Ticket>) => {
      const next = action.payload;
      state.tickets = [
        next,
        ...state.tickets.filter((t) => t.id !== next.id),
      ];
      if (state.detail?.id === next.id) state.detail = next;
      state.working = false;
    },
    addComment: (state, action: PayloadAction<TicketComment>) => {
      state.comments = [...state.comments, action.payload];
      if (action.payload.id > state.lastCommentId) {
        state.lastCommentId = action.payload.id;
      }
      state.working = false;
    },
    /**
     * What a poll brought back.
     *
     * Ids already held are dropped rather than trusted away — a reply posted
     * and a poll in flight can cross, and the same comment appearing twice is
     * the one bug people notice immediately.
     */
    appendComments: (state, action: PayloadAction<TicketComment[]>) => {
      const known = new Set(state.comments.map((c) => c.id));
      const fresh = action.payload.filter((c) => !known.has(c.id));
      if (fresh.length === 0) return;
      state.comments = [...state.comments, ...fresh];
      state.lastCommentId = fresh.reduce(
        (high, c) => (c.id > high ? c.id : high),
        state.lastCommentId,
      );
    },
    /**
     * The ticket as a poll found it, without disturbing the thread.
     *
     * Separate from upsertTicket because that one ends a piece of work; a poll
     * is not work, and must never clear a spinner somebody else's reply is
     * waiting on.
     */
    refreshHeader: (state, action: PayloadAction<Ticket>) => {
      const next = action.payload;
      if (state.detail?.id === next.id) state.detail = next;
      state.tickets = state.tickets.map((t) => (t.id === next.id ? next : t));
    },
    setPending: (state, action: PayloadAction<Ticket[]>) => {
      state.pending = action.payload;
    },
    /** Apply the held queue, which is the only thing that reorders it. */
    applyPending: (state) => {
      if (!state.pending) return;
      state.tickets = state.pending;
      state.pending = null;
    },

    setTab: (state, action: PayloadAction<QueueTab>) => {
      state.tab = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setCompany: (state, action: PayloadAction<number | null>) => {
      state.company = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TicketFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = noFilters;
    },
    openNew: (state, action: PayloadAction<boolean>) => {
      state.newOpen = action.payload;
    },
    openClosing: (state, action: PayloadAction<boolean>) => {
      state.closingOpen = action.payload;
    },
    /** The dev preview switch. Clears the open ticket, because the two views
     *  do not show the same thing about one. */
    setAsClient: (state, action: PayloadAction<boolean>) => {
      state.asClient = action.payload;
      state.tab = action.payload ? "all" : "all";
      state.selectedId = null;
      state.detail = null;
      state.comments = [];
      state.attachments = [];
      // The client grid has none of the columns these filter, so a leftover
      // one would narrow a list with nothing on screen to explain it.
      state.filters = noFilters;
    },
    resetTickets: () => initialState,
  },
});

export const {
  startLoad,
  setTickets,
  failLoad,
  setLookups,
  setAssignees,
  selectTicket,
  setDetail,
  setAttachments,
  failDetail,
  startWork,
  endWork,
  upsertTicket,
  addComment,
  appendComments,
  refreshHeader,
  setPending,
  applyPending,
  setTab,
  setSearch,
  setCompany,
  setFilters,
  clearFilters,
  openNew,
  openClosing,
  setAsClient,
  resetTickets,
} = devTicketsSlice.actions;

export default devTicketsSlice.reducer;
