import axios from "axios";

/**
 * The Client Help Desk endpoints.
 *
 * Ported from the old `ticket_api` service onto the main API, so it takes the
 * bearer token the app already has — no API key, and no `userid` parameter
 * anywhere in it. Scope is enforced in the SQL rather than in the route: you
 * see your company's tickets plus any you opened, and a ticket outside that is
 * a 404 rather than a 403, so nobody learns what they cannot see.
 */

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + token,
});

/** open | in_progress | waiting | closed — four, not the mock's three. */
export type TicketStatus = "open" | "in_progress" | "waiting" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface TicketLabel {
  id: number;
  name: string;
  color: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  due_at: string | null;
  /** The client who filed it, as a users.id. */
  opened_by: number;
  opened_by_username: string;
  opened_by_name: string;
  /** Derived from the opener's company_link at query time — the ticket
   *  itself has no company column. */
  company: number | null;
  company_name: string | null;
  category_id: number | null;
  category_name: string | null;
  /**
   * The assigned tech, in two id spaces.
   *
   * `assigned_tech_id` is a ticket_techs row and is never sent anywhere;
   * `assignee_id` is the SAME person as a users.id, which is what the assign
   * endpoint takes and what "Mine" compares against. Comparing the other one
   * happens to work for a single tech and fails for everybody else.
   */
  assigned_tech_id: number | null;
  assignee_id: number | null;
  assigned_tech: string | null;
  labels: TicketLabel[];
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  userid: number;
  comment: string;
  /** Only ever true in a payload for someone with canViewAll — internal notes
   *  are filtered out in the query, never sent to a client at all. */
  is_internal: boolean;
  created_at: string;
  author_username: string;
  author_name: string;
}

export interface TicketAttachment {
  id: number;
  original_filename: string;
  content_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by_name: string;
}

export interface TicketAssignee {
  tech_id: number;
  /** What the assign endpoint takes. */
  userid: number;
  name: string;
  tech_code: string | null;
  is_active: boolean;
  username: string;
}

export interface TicketLookups {
  labels: TicketLabel[];
  categories: { id: number; name: string }[];
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  resolutionTypes: { value: string; description: string }[];
  attachments: { maxBytes: number; extensions: string[] };
}

/**
 * The two capability flags, on every list and detail response.
 *
 * `canViewAll` sees every company's queue and reads internal notes;
 * `canManage` assigns, edits, changes status and writes internal notes. Gate
 * the UI on these rather than on user levels: the rule lives server-side and
 * the two would otherwise drift.
 */
export interface TicketCaps {
  canViewAll: boolean;
  canManage: boolean;
}

interface Answered {
  error?: number;
  success?: boolean;
  msg?: string;
}

/**
 * Whether an answer failed, whatever the status line said.
 *
 * The house convention: validation and permission failures raise properly,
 * but an unexpected error is caught at the bottom of each endpoint and
 * returned as HTTP 200 with `success: false`. Anything that reads only the
 * status code takes a database failure for a success.
 */
export const ticketFailed = (j: Answered) =>
  j.error !== 0 || j.success === false;

export interface TicketListResp extends TicketCaps {
  error: number;
  success: boolean;
  count: number;
  tickets: Ticket[];
}

/** Newest-updated first, so a ticket with a new reply or attachment rises. */
export const listTickets = (
  url: string,
  token: string,
  params: { status?: string; company?: number } = {},
) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/",
    params,
  });

export interface TicketDetailResp extends TicketCaps {
  error: number;
  success: boolean;
  ticket: Ticket;
  comments: TicketComment[];
}

export const getTicket = (url: string, token: string, id: number) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/" + id,
  });

export const getTicketLookups = (url: string, token: string) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/lookups",
  });

export const getTicketAssignees = (url: string, token: string) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/assignees",
  });

/**
 * File one.
 *
 * No `opened_by` — that is the token. No assignee: it lands in the queue
 * unassigned and a tech takes it. The description is written as the first
 * message in the thread, so the tech reads the problem where the conversation
 * is. `company` must be the opener's own; anything else is a 400 rather than a
 * silent misfiling.
 */
export const createTicket = (
  url: string,
  token: string,
  body: {
    title: string;
    description: string;
    priority?: TicketPriority;
    company?: number;
    category_id?: number | null;
    due_at?: string | null;
    label_ids?: number[];
  },
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "tickets/",
    data: body,
  });

/** Only the fields sent change. Status and assignment are deliberately not
 *  here — they carry consequences a field edit must not be able to skip. */
export const patchTicket = (
  url: string,
  token: string,
  id: number,
  body: Partial<
    Pick<Ticket, "title" | "description" | "priority" | "category_id" | "due_at">
  >,
) =>
  axios({
    method: "PATCH",
    headers: headers(token),
    url: url + "tickets/" + id,
    data: body,
  });

export const listTicketComments = (url: string, token: string, id: number) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/" + id + "/comments",
  });

/** `is_internal` needs canManage: a client asking for one gets a 403 rather
 *  than a silent downgrade to a public reply. */
export const addTicketComment = (
  url: string,
  token: string,
  id: number,
  body: { comment: string; is_internal: boolean },
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "tickets/" + id + "/comments",
    data: body,
  });

/**
 * Take it, hand it over, or release it with null.
 *
 * Assigning an `open` ticket also moves it to `in_progress` — picking it up is
 * when work starts. Only from open: waiting and closed keep their status.
 */
export const assignTicket = (
  url: string,
  token: string,
  id: number,
  assignee_id: number | null,
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "tickets/" + id + "/assign",
    data: { assignee_id },
  });

/**
 * Move it, and on the way to closed say what was done.
 *
 * Closing without a `resolution` is a 400. The resolution posts to the thread
 * as a VISIBLE reply, which is how the client is told. `resolution_type` is
 * closing-only and is stored as a `type:` label — it is what makes a year of
 * tickets answerable later.
 */
export const setTicketStatus = (
  url: string,
  token: string,
  id: number,
  body: { status: TicketStatus; resolution?: string; resolution_type?: string },
) =>
  axios({
    method: "POST",
    headers: headers(token),
    url: url + "tickets/" + id + "/status",
    data: body,
  });

export const listTicketAttachments = (url: string, token: string, id: number) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/" + id + "/attachments",
  });

export const uploadTicketAttachment = (
  url: string,
  token: string,
  id: number,
  file: File,
) => {
  const form = new FormData();
  form.append("file", file);
  return axios({
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    url: url + "tickets/" + id + "/attachments",
    data: form,
  });
};

/** A signed link, minted on click rather than when the ticket opens, so
 *  nothing signs urls for files nobody opens. */
export const getAttachmentUrl = (
  url: string,
  token: string,
  id: number,
  attachmentId: number,
) =>
  axios({
    method: "GET",
    headers: headers(token),
    url: url + "tickets/" + id + "/attachments/" + attachmentId + "/url",
  });
