// Utils
import { storesOf } from ".";

// Interfaces
import type { Ticket, TicketStatus } from "../../../../api/tickets";
import type {
  QueueTab,
  TicketFilters,
} from "../../../../features/dev/devTicketsSlice";

/**
 * The filtering behind the tabs and the search box, all on rows already in
 * hand; only status and company go to the server.
 */

/** How a status reads on screen. The database's four, not the mock's three. */
export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting",
  closed: "Closed",
};

/**
 * Chip colours, from the app's own tokens. The states differ in lightness as
 * well as hue, with `waiting` and `open` (most often confused) furthest apart.
 */
export const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-row_selected text-content",
  in_progress: "bg-filter_active text-brand_navy_hover",
  waiting: "bg-amber-50 text-amber-900",
  closed: "bg-brand_green_tint text-brand_green_darker",
};

export const PRIORITY_CLASS: Record<string, string> = {
  urgent: "bg-brand_danger_bg text-brand_danger",
  high: "bg-amber-50 text-amber-900",
  normal: "bg-row_selected text-content/95",
  low: "bg-row_selected text-content/95",
};

/**
 * Is this one mine? Compares `assignee_id` (a users.id), not
 * `assigned_tech_id`, which is a ticket_techs id.
 */
export const isMine = (ticket: Ticket, userid: number) =>
  ticket.assignee_id !== null && ticket.assignee_id === userid;

export const isUnassigned = (ticket: Ticket) => ticket.assignee_id === null;

/** Everything a search box can match without another call. */
const haystack = (ticket: Ticket) =>
  [
    ticket.ticket_number,
    ticket.title,
    ticket.description,
    ticket.opened_by_name,
    ticket.company_name,
    ticket.assigned_tech,
    // "#54" and "S&C Foods 54" both find it.
    ...storesOf(ticket).flatMap((s) => [`#${s.store_number}`, s.store_name]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const matchesSearch = (ticket: Ticket, search: string) => {
  const term = search.trim().toLowerCase();
  return term === "" || haystack(ticket).includes(term);
};

/**
 * The rows a tab shows. "All" is every open ticket; closed ones have their own tab.
 */
export const onTab = (ticket: Ticket, tab: QueueTab, userid: number) => {
  if (tab === "closed") return ticket.status === "closed";
  if (ticket.status === "closed") return false;
  if (tab === "unassigned") return isUnassigned(ticket);
  if (tab === "mine") return isMine(ticket, userid);
  if (tab === "urgent") return ticket.priority === "urgent";
  return true;
};

/** Case-insensitive contains, with an empty filter meaning every row. */
const holds = (value: string | null, term: string) =>
  term.trim() === "" ||
  (value ?? "").toLowerCase().includes(term.trim().toLowerCase());

/**
 * The column filters. An empty list means every value, not none.
 */
export const matchesFilters = (ticket: Ticket, filters: TicketFilters) => {
  if (filters.status.length && !filters.status.includes(ticket.status)) {
    return false;
  }
  if (filters.priority.length && !filters.priority.includes(ticket.priority)) {
    return false;
  }
  if (!holds(ticket.title, filters.title)) return false;
  if (!holds(ticket.company_name, filters.company)) return false;
  if (!holds(ticket.opened_by_name, filters.openedBy)) return false;
  // An unassigned ticket answers to the word, since that is what the column
  // says and what someone would type looking for one.
  if (!holds(ticket.assigned_tech ?? "Unassigned", filters.assignee)) {
    return false;
  }
  // Any of the picked stores. A store-less ticket matches none of them.
  if (
    filters.stores?.length &&
    !storesOf(ticket).some((s) => filters.stores.includes(String(s.storeid)))
  ) {
    return false;
  }
  return true;
};

export const visibleTickets = (
  tickets: Ticket[],
  tab: QueueTab,
  search: string,
  userid: number,
  filters?: TicketFilters,
) =>
  tickets.filter(
    (ticket) =>
      onTab(ticket, tab, userid) &&
      matchesSearch(ticket, search) &&
      (!filters || matchesFilters(ticket, filters)),
  );

/** What each tab would show, for the counts on the tabs themselves. */
export const tabCounts = (tickets: Ticket[], userid: number) => ({
  all: tickets.filter((t) => t.status !== "closed").length,
  unassigned: tickets.filter((t) => t.status !== "closed" && isUnassigned(t))
    .length,
  mine: tickets.filter((t) => t.status !== "closed" && isMine(t, userid))
    .length,
  urgent: tickets.filter(
    (t) => t.status !== "closed" && t.priority === "urgent",
  ).length,
  closed: tickets.filter((t) => t.status === "closed").length,
});

/**
 * A server timestamp, as a moment. The API sends UTC with no zone, which
 * JavaScript reads as local time, so a stamp without one is read as UTC.
 */
export const parseServerTime = (iso: string): number => {
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso.trim());
  return Date.parse(zoned ? iso : `${iso}Z`);
};

/**
 * Why a new ticket did not send, in words the sender can act on. The server's
 * "no company" 400 is shown as written; anything else reads as our fault.
 */
export const sendFailureText = (err: unknown): string => {
  const resp = (
    err as { response?: { status?: number; data?: { detail?: unknown } } }
  )?.response;
  const detail = resp?.data?.detail;
  if (resp?.status === 400 && typeof detail === "string" && detail.trim()) {
    return detail;
  }
  const message = (err as { message?: string })?.message;
  return message ? `That did not send: ${message}` : "That did not send.";
};

/**
 * When something happened, in the reader's own time: an age under a day,
 * then "yesterday", then a date.
 */
export const whenText = (iso: string, now = Date.now()) => {
  const at = parseServerTime(iso);
  if (Number.isNaN(at)) return "";
  const mins = Math.floor((now - at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return new Date(at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

/** A full stamp, for the places a thread needs one. */
export const stampText = (iso: string) => {
  const at = new Date(parseServerTime(iso));
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

/**
 * What kind of fix closed it, if anything says. It is stored as a reserved
 * `type:` label, which the pickers hide.
 */
export const resolutionLabel = (ticket: Ticket) => {
  const found = ticket.labels?.find((l) => l.name.startsWith("type:"));
  if (!found) return null;
  const word = found.name.slice("type:".length).replace(/_/g, " ").trim();
  return word ? word[0].toUpperCase() + word.slice(1) : null;
};

export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Why this file cannot be attached, or null. The same extension and type check
 * the endpoint makes, done first to save a 413.
 */
export const attachmentProblem = (
  file: File,
  limits: { maxBytes: number; extensions: string[] } | undefined,
) => {
  if (!limits) return null;
  const dot = file.name.lastIndexOf(".");
  const ext = dot === -1 ? "" : file.name.slice(dot).toLowerCase();
  if (!limits.extensions.includes(ext)) {
    return `${ext || "That file"} is not one the help desk takes — ${limits.extensions.join(" ")}.`;
  }
  if (file.size > limits.maxBytes) {
    return `That file is ${fileSize(file.size)}; the limit is ${fileSize(limits.maxBytes)}.`;
  }
  return null;
};

/**
 * Initials for the inbox avatar, from the first and last words of the name
 * (as the TitleBar avatar does).
 */
export const initialsOf = (name: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
};

/**
 * The reply preview and unread flag, which the list endpoint does not send yet.
 * Read through here so there is one place to change when they arrive.
 */
export const snippetOf = (ticket: Ticket): string | null =>
  (ticket as Ticket & { last_comment?: string | null }).last_comment ?? null;

export const isUnread = (ticket: Ticket): boolean =>
  (ticket as Ticket & { unread?: boolean }).unread === true;

/** What each status folder would show. Open work only, matching `tabCounts`
 *  — the Closed folder is the one place finished tickets live. */
export const statusCounts = (tickets: Ticket[]) => {
  const out: Record<string, number> = {};
  for (const t of tickets) {
    if (t.status === "closed") continue;
    out[t.status] = (out[t.status] ?? 0) + 1;
  }
  return out;
};

/** The same, by priority. */
export const priorityCounts = (tickets: Ticket[]) => {
  const out: Record<string, number> = {};
  for (const t of tickets) {
    if (t.status === "closed") continue;
    out[t.priority] = (out[t.priority] ?? 0) + 1;
  }
  return out;
};

/**
 * Everything else this person has filed, newest first, from the queue already
 * in memory.
 */
export const alsoFrom = (tickets: Ticket[], ticket: Ticket, limit = 5) =>
  tickets
    .filter((t) => t.opened_by === ticket.opened_by && t.id !== ticket.id)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);

/** How long this person has been filing, and how much. */
export const openerStats = (tickets: Ticket[], ticket: Ticket) => {
  const theirs = tickets.filter((t) => t.opened_by === ticket.opened_by);
  const open = theirs.filter((t) => t.status !== "closed").length;
  const first = theirs.reduce<string | null>(
    (oldest, t) =>
      oldest === null || t.created_at.localeCompare(oldest) < 0
        ? t.created_at
        : oldest,
    null,
  );
  const byCategory = new Map<string, number>();
  for (const t of theirs) {
    if (!t.category_name) continue;
    byCategory.set(t.category_name, (byCategory.get(t.category_name) ?? 0) + 1);
  }
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  return { filed: theirs.length, open, first, topCategory: top?.[0] ?? null };
};

/**
 * The labels meant for a reader. `type:` labels are hidden here; they carry
 * the resolution, which `resolutionLabel` reads.
 */
export const visibleLabels = (ticket: Ticket) =>
  (ticket.labels ?? []).filter((l) => !l.name.startsWith("type:"));
