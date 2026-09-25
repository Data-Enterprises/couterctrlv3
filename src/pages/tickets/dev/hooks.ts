import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";
import {
  addTicketComment,
  assignTicket,
  createTicket,
  getAttachmentUrl,
  getTicket,
  getTicketAssignees,
  getTicketLookups,
  listTicketAttachments,
  listTickets,
  setTicketStatus,
  ticketFailed,
  uploadTicketAttachment,
  type Ticket,
  type TicketDetailResp,
  type TicketListResp,
  type TicketPriority,
  type TicketStatus,
} from "../../../api/tickets";
import {
  addComment,
  appendComments,
  applyPending,
  refreshHeader,
  setPending,
  endWork,
  failDetail,
  failLoad,
  openClosing,
  openNew,
  selectTicket,
  setAssignees,
  setAttachments,
  setDetail,
  setLookups,
  setTickets,
  startLoad,
  startWork,
  upsertTicket,
} from "../../../features/dev/devTicketsSlice";
import { visibleTickets, tabCounts } from "./ticketsUtils";

/**
 * Everything the Client Help Desk needs, in one hook.
 *
 * The page is dev-only, so every call goes through `useDevApi` — the dev URL
 * and dev token straight from the environment, never `app.url`, which follows
 * whichever API the session is browsing.
 */
export const useTicketsCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useDevApi();
  const toast = useToast();
  const tickets = useAppSelector((state) => state.dev.tickets);
  const userid = useAppSelector((state) => state.user.userid);

  /**
   * Which view this is.
   *
   * `canViewAll` decides it, and the dev preview can only ever take a view
   * away — a client can never be shown the tech one by flipping a switch in
   * the browser, because the flag it would have to forge is the server's.
   */
  const isTech = tickets.caps.canViewAll && !tickets.asClient;
  const canManage = tickets.caps.canManage && !tickets.asClient;

  const rows = useMemo(
    () =>
      visibleTickets(
        tickets.tickets,
        tickets.tab,
        tickets.search,
        userid,
        tickets.filters,
      ),
    [tickets.tickets, tickets.tab, tickets.search, userid, tickets.filters],
  );
  const counts = useMemo(
    () => tabCounts(tickets.tickets, userid),
    [tickets.tickets, userid],
  );

  const failed = (what: string) => (err: JsonError) => {
    const status = (err as { status?: number }).status;
    dispatch(
      failLoad(
        status === 403
          ? "That needs a ticket tech's account."
          : status === 404
            ? "That ticket is not one you can see."
            : `${what}: ${err.message}`,
      ),
    );
  };

  /** The queue, and the pickers behind it. Three calls, none waiting on
   *  another. */
  const load = () => {
    dispatch(startLoad());
    listTickets(url, token, tickets.company ? { company: tickets.company } : {})
      .then((resp) => {
        const j = resp.data as TicketListResp;
        if (ticketFailed(j)) {
          dispatch(failLoad("Could not read the tickets."));
          return;
        }
        dispatch(
          setTickets({
            tickets: j.tickets ?? [],
            caps: { canViewAll: j.canViewAll, canManage: j.canManage },
          }),
        );
      })
      .catch(failed("Could not read the tickets"));

    getTicketLookups(url, token)
      .then((resp) => {
        if (!ticketFailed(resp.data)) dispatch(setLookups(resp.data));
      })
      .catch(() => {
        /* The pickers degrade to what the rows already carry. */
      });
  };

  /** Only a tech has this one — a client has nobody to assign to. */
  const loadAssignees = () => {
    getTicketAssignees(url, token)
      .then((resp) => {
        if (!ticketFailed(resp.data)) {
          dispatch(setAssignees(resp.data.assignees ?? resp.data ?? []));
        }
      })
      .catch(() => {
        /* Assignment simply stays unavailable. */
      });
  };

  /**
   * Open one.
   *
   * The detail carries the thread and both flags in a single call, so there is
   * no window where the page has a ticket and does not yet know what may be
   * done to it. Attachments are a second call because they are metadata
   * nobody may look at.
   */
  const open = (id: number) => {
    dispatch(selectTicket(id));
    getTicket(url, token, id)
      .then((resp) => {
        const j = resp.data as TicketDetailResp;
        if (ticketFailed(j)) {
          dispatch(failDetail("Could not open that ticket."));
          return;
        }
        dispatch(
          setDetail({
            ticket: j.ticket,
            comments: j.comments ?? [],
            caps: { canViewAll: j.canViewAll, canManage: j.canManage },
          }),
        );
      })
      .catch(failed("Could not open that ticket"));

    listTicketAttachments(url, token, id)
      .then((resp) => {
        if (!ticketFailed(resp.data)) {
          dispatch(setAttachments(resp.data.attachments ?? []));
        }
      })
      .catch(() => {
        /* An empty list reads the same as none. */
      });
  };

  /**
   * Ask what is new on the open ticket.
   *
   * `since` trims the thread to what has not been seen; the ticket comes back
   * whole, because status and assignee can move while a pane is open and a
   * header that quietly lied would be worse than no polling.
   *
   * Nothing here touches `working` or the composer — a poll must never clear
   * a spinner or a half-typed reply.
   */
  const poll = () => {
    const id = tickets.selectedId;
    if (!id) return Promise.resolve();
    return getTicket(url, token, id, tickets.lastCommentId)
      .then((resp) => {
        const j = resp.data as TicketDetailResp;
        if (ticketFailed(j)) return;
        if (j.comments?.length) dispatch(appendComments(j.comments));
        if (j.ticket) dispatch(refreshHeader(j.ticket));
      })
      .catch(() => {
        /* A missed poll is the next one's problem. */
      });
  };

  /**
   * Ask what is new in the queue, and hold it.
   *
   * The list sorts by updated_at, so applying this would move rows under
   * somebody reaching for one — they would watch TCK-14 jump because a reply
   * landed on a different ticket, and click the wrong thing. Thirty seconds
   * stale is a smaller problem than that, so it is offered rather than taken.
   */
  const pollList = () => {
    return listTickets(
      url,
      token,
      tickets.company ? { company: tickets.company } : {},
    )
      .then((resp) => {
        const j = resp.data as TicketListResp;
        if (ticketFailed(j) || !j.tickets) return;
        const known = new Set(tickets.tickets.map((t) => t.id));
        const moved = j.tickets.some(
          (t) =>
            !known.has(t.id) ||
            tickets.tickets.find((k) => k.id === t.id)?.updated_at !==
              t.updated_at,
        );
        if (moved) dispatch(setPending(j.tickets));
      })
      .catch(() => {
        /* Same: the next one will ask again. */
      });
  };

  const file = (body: {
    title: string;
    description: string;
    priority?: TicketPriority;
    category_id?: number | null;
  }) => {
    dispatch(startWork());
    createTicket(url, token, body)
      .then((resp) => {
        if (ticketFailed(resp.data) || !resp.data.ticket) {
          dispatch(failLoad("That did not send."));
          dispatch(endWork());
          return;
        }
        const ticket = resp.data.ticket as Ticket;
        dispatch(upsertTicket(ticket));
        dispatch(openNew(false));
        toast.success(`${ticket.ticket_number} is with the help desk`);
        open(ticket.id);
      })
      .catch((err: JsonError) => {
        dispatch(endWork());
        failed("That did not send")(err);
      });
  };

  const reply = (comment: string, internal: boolean) => {
    const id = tickets.selectedId;
    if (!id || !comment.trim()) return;
    dispatch(startWork());
    addTicketComment(url, token, id, {
      comment: comment.trim(),
      is_internal: internal,
    })
      .then((resp) => {
        if (ticketFailed(resp.data) || !resp.data.comment) {
          dispatch(failLoad("That reply did not post."));
          dispatch(endWork());
          return;
        }
        dispatch(addComment(resp.data.comment));
      })
      .catch((err: JsonError) => {
        dispatch(endWork());
        failed("That reply did not post")(err);
      });
  };

  /** Taking a ticket is this with your own id; null hands it back. */
  const assign = (assigneeId: number | null) => {
    const id = tickets.selectedId;
    if (!id) return;
    dispatch(startWork());
    assignTicket(url, token, id, assigneeId)
      .then((resp) => {
        if (ticketFailed(resp.data) || !resp.data.ticket) {
          dispatch(failLoad("That did not reassign."));
          dispatch(endWork());
          return;
        }
        dispatch(upsertTicket(resp.data.ticket));
      })
      .catch((err: JsonError) => {
        dispatch(endWork());
        failed("That did not reassign")(err);
      });
  };

  /**
   * Move it. Closing carries the resolution, which the modal collects —
   * nothing else can reach `closed`, because that is the one field nobody can
   * supply afterwards.
   */
  const move = (
    status: TicketStatus,
    resolution?: string,
    resolutionType?: string,
  ) => {
    const id = tickets.selectedId;
    if (!id) return;
    dispatch(startWork());
    setTicketStatus(url, token, id, {
      status,
      ...(resolution ? { resolution } : {}),
      ...(resolutionType ? { resolution_type: resolutionType } : {}),
    })
      .then((resp) => {
        if (ticketFailed(resp.data) || !resp.data.ticket) {
          dispatch(failLoad("That status did not stick."));
          dispatch(endWork());
          return;
        }
        dispatch(upsertTicket(resp.data.ticket));
        dispatch(openClosing(false));
        // The resolution posts as a visible reply, so the thread is a call
        // behind until it is read again.
        open(id);
      })
      .catch((err: JsonError) => {
        dispatch(endWork());
        failed("That status did not stick")(err);
      });
  };

  const attach = (file: File) => {
    const id = tickets.selectedId;
    if (!id) return;
    dispatch(startWork());
    uploadTicketAttachment(url, token, id, file)
      .then((resp) => {
        if (ticketFailed(resp.data)) {
          dispatch(failLoad("That file did not upload."));
          dispatch(endWork());
          return;
        }
        dispatch(endWork());
        open(id);
      })
      .catch((err: JsonError) => {
        dispatch(endWork());
        const status = (err as { status?: number }).status;
        dispatch(
          failLoad(
            status === 413
              ? "That file is over the 25 MB limit."
              : "That file did not upload: " + err.message,
          ),
        );
      });
  };

  /** Signed on click, and only then — opening a ticket signs nothing. */
  const openAttachment = (attachmentId: number) => {
    const id = tickets.selectedId;
    if (!id) return;
    getAttachmentUrl(url, token, id, attachmentId)
      .then((resp) => {
        if (!ticketFailed(resp.data) && resp.data.url) {
          window.open(resp.data.url, "_blank", "noopener,noreferrer");
        }
      })
      .catch(failed("Could not open that file"));
  };

  return {
    ...tickets,
    dispatch,
    userid,
    isTech,
    canManage,
    rows,
    counts,
    load,
    loadAssignees,
    poll,
    pollList,
    applyPending: () => dispatch(applyPending()),
    open,
    file,
    reply,
    assign,
    move,
    attach,
    openAttachment,
  };
};

export type TicketsCtx = ReturnType<typeof useTicketsCtx>;
