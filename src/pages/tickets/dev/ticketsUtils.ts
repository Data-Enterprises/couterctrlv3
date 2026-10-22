import type { Ticket, TicketStatus } from "../../../api/tickets";
import type {
  QueueTab,
  TicketFilters,
} from "../../../features/dev/devTicketsSlice";

/**
 * The filtering behind the tabs and the search box.
 *
 * All of it runs on rows already in hand: the endpoint sends every field these
 * need, so switching tabs costs nothing and a queue stays responsive while a
 * tech reads down it. Only status and company are worth a round trip, and the
 * endpoint takes those as query params.
 */

/** How a status reads on screen. The database's four, not the mock's three. */
export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting",
  closed: "Closed",
};

/**
 * Chip colours, from the app's own tokens.
 *
 * Four states have to be told apart at a glance, so they differ in lightness
 * as well as hue — `waiting` and `open` are the pair most often confused, and
 * they sit at opposite ends of that range.
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
  normal: "bg-row_selected text-content/85",
  low: "bg-row_selected text-content/85",
};

/**
 * Is this one mine?
 *
 * Compares `assignee_id` — the tech as a users.id — against the signed-in
 * user. `assigned_tech_id` is the same person in the ticket_techs id space and
 * comparing it works for exactly one tech by coincidence.
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const matchesSearch = (ticket: Ticket, search: string) => {
  const term = search.trim().toLowerCase();
  return term === "" || haystack(ticket).includes(term);
};

/**
 * The rows a tab shows.
 *
 * "All" means every OPEN piece of work rather than literally everything —
 * closed tickets have their own tab, and a queue that filled up with a year of
 * finished work would not be a queue.
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
 * The column filters.
 *
 * An empty list means every one of them rather than none — the same reading
 * the export page's filters use, and the one people expect from a column
 * heading they have not touched.
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
  return true;
};

/**
 * The tickets a customer may see, whatever the server sent.
 *
 * `GET tickets/` scopes a customer by "the opener shares a company with me",
 * and a ticket has no company of its own -- it belongs to every company its
 * opener holds. DCR staff hold several, so a ticket one of them opened under
 * Houchens reached a Bruces customer: the dev review saw 15 company-1 tickets
 * on a company-3 account with `canViewAll: false`.
 *
 * The server is the real fix. This is the backstop, on the same rule the
 * backend should move to: a customer sees what they opened, and what is filed
 * under a company they hold. `company` here is the one the row reports -- the
 * opener's lowest company id -- so a multi-company opener's ticket shows under
 * exactly one company instead of all of them. A tech sees everything, as the
 * server intends.
 */
export const ticketsInScope = (
  tickets: Ticket[],
  canViewAll: boolean,
  viewerCompanyIds: number[],
  userid: number,
) =>
  canViewAll
    ? tickets
    : tickets.filter(
        (t) =>
          t.opened_by === userid ||
          (t.company !== null && viewerCompanyIds.includes(t.company)),
      );

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
  mine: tickets.filter((t) => t.status !== "closed" && isMine(t, userid)).length,
  urgent: tickets.filter((t) => t.status !== "closed" && t.priority === "urgent")
    .length,
  closed: tickets.filter((t) => t.status === "closed").length,
});

/**
 * When something happened, in the reader's own time.
 *
 * Recent things read better as an age than as a clock time — "12m" answers
 * "is anyone on this?" without arithmetic — and anything older than a day is
 * a date, because "31h" is not how people think.
 */
export const whenText = (iso: string, now = Date.now()) => {
  const at = new Date(iso).getTime();
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
  const at = new Date(iso);
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
 * What kind of fix closed it, if anything says.
 *
 * Closing stores the resolution type as a reserved `type:` label rather than a
 * column, so it rides along on the ticket like any other label. The lookups
 * hide those from the picker — they are written by closing, not chosen by
 * hand — which is why reading one back means looking here.
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
 * Why this file cannot be attached, or null.
 *
 * The endpoint checks the extension AND the declared type, so a .exe labelled
 * image/png is refused there. This is the same check one step earlier, to save
 * someone a 413 after the upload.
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
 * Initials for the inbox avatar.
 *
 * Two letters from the ends of the name, so "Randall Nunez" is RN and a
 * single-word name still gets something. Mirrors the TitleBar avatar, which
 * is the only other place in the app that draws one.
 */
export const initialsOf = (name: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
};

/**
 * The two fields the inbox row has room for and the list endpoint does not
 * send yet: a preview of the newest reply, and whether this reader has seen
 * it.
 *
 * Read through here rather than off the row so there is one place to delete
 * the cast when they arrive. A snippet needs the list query to carry the last
 * comment; unread needs a per-user read marker, which is a real table and not
 * something the client can infer — `updated_at` moves for an edit, an assign
 * and a status change, none of which is a message anybody missed.
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
 * Everything else this person has filed, newest first.
 *
 * The queue is already in memory and already holds every company a tech can
 * see, so "their other tickets" costs no call — it is the list filtered by
 * the opener, minus the one being read.
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
 * The labels meant for a reader.
 *
 * `type:` is reserved: it carries the resolution and is read by
 * `resolutionLabel`, which renders it as a word in the closed strip. Drawn
 * raw it reads as "type:fixed", which is a database row on the screen.
 */
export const visibleLabels = (ticket: Ticket) =>
  (ticket.labels ?? []).filter((l) => !l.name.startsWith("type:"));
