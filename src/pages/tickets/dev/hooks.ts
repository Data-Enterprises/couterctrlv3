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
import { ticketsInScope, visibleTickets, tabCounts } from "./ticketsUtils";

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
  const userCompanies = useAppSelector((state) => state.user.companies);

  /**
   * Which view this is.
   *
   * Both flags come back on every list and detail response, so the page reads
   * the server's answer rather than deriving one from a user level. There is
   * no client-side override: a view can only be what the payload allows.
   */
  const isTech = tickets.caps.canViewAll;
  const canManage = tickets.caps.canManage;
  // The roster. Level 9 and nothing less, so that a desk nobody is on is
  // always fixable by somebody.
  const canManageTechs = tickets.caps.canManageTechs;

  /** What this reader may see at all, before any tab or search narrows it.
   *  Counts read from it too, so a tab can't count tickets it won't show. */
  const scoped = useMemo(
    () =>
      ticketsInScope(
        tickets.tickets,
        isTech,
        userCompanies.map((c) => c.company),
        userid,
      ),
    [tickets.tickets, isTech, userCompanies, userid],
  );

  const rows = useMemo(
    () =>
      visibleTickets(
        scoped,
        tickets.tab,
        tickets.search,
        userid,
        tickets.filters,
      ),
    [scoped, tickets.tab, tickets.search, userid, tickets.filters],
  );
  const counts = useMemo(() => tabCounts(scoped, userid), [scoped, userid]);

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
            caps: {
              canViewAll: j.canViewAll,
              canManage: j.canManage,
              canManageTechs: j.canManageTechs,
            },
          }),
        );
      })
      .catch(failed("Could not read the tickets"));

    loadLookups();
    // The third of the three. It was written, exported and never called, so
    // `assignees` stayed empty for everyone and the assign picker could only
    // ever offer Unassigned — which is exactly what a tech sees when they try
    // to hand a ticket over.
    //
    // Not gated on `canManage`: that arrives with the list above, and waiting
    // for it would make this the one call that depends on another. The
    // endpoint is a tech's to begin with, a client gets a 403, and the catch
    // inside already leaves assignment unavailable — which is the same place
    // a client ends up either way, since the picker is not rendered for them.
    loadAssignees();
  };

  /**
   * The pickers on their own.
   *
   * Filing a ticket from another page needs the categories and the
   * attachment limits and nothing else — pulling the whole queue to get them
   * would fetch every ticket the reader can see for the sake of two lists.
   */
  const loadLookups = () => {
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
   * The detail carries the thread, the files and both flags in a single call,
   * so there is no window where the page has a ticket and does not yet know
   * what may be done to it.
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
            attachments: j.attachments ?? [],
            caps: {
              canViewAll: j.canViewAll,
              canManage: j.canManage,
              canManageTechs: j.canManageTechs,
            },
          }),
        );
      })
      .catch(failed("Could not open that ticket"));
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
        // Replaced, not appended: attaching writes no comment, so `since`
        // finds nothing and a file the other side just sent would never
        // arrive. This is the line that makes a screenshot show up.
        if (j.attachments) dispatch(setAttachments(j.attachments));
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
        // Whether anything actually moved is decided in the reducer, where
        // the current list is — this interval was created once and holds the
        // closure it was born with.
        dispatch(setPending(j.tickets));
      })
      .catch(() => {
        /* Same: the next one will ask again. */
      });
  };

  /**
   * File one, with whatever was attached to it.
   *
   * Two calls, because an upload needs a ticket id: create, then one upload
   * per file. Sequential rather than parallel — each upload bumps
   * `updated_at`, and a couple of screenshots is not worth racing.
   *
   * The failure case is the part that matters. **The ticket exists from the
   * moment the create returns.** A file that then fails to upload must not be
   * reported as a ticket that failed to send: that throws away something
   * somebody already typed, and there is nothing to roll back to. So it says
   * the ticket is filed, names the file that did not make it, and points at
   * the Attach button on the ticket itself.
   */
  const fileTicket = async (
    body: {
      title: string;
      description: string;
      priority?: TicketPriority;
      category_id?: number | null;
    },
    files: File[] = [],
    /**
     * What to do once it is filed, when opening it is not the answer.
     *
     * The help desk opens the new ticket, because that is the screen it is
     * on. A report filed from Sales has no detail pane to open it into, and
     * fetching one would be a call whose result nothing draws — so that
     * caller closes its own modal instead.
     */
    after?: (ticket: Ticket) => void,
  ) => {
    dispatch(startWork());
    let ticket: Ticket;
    try {
      const resp = await createTicket(url, token, body);
      if (ticketFailed(resp.data) || !resp.data.ticket) {
        dispatch(failLoad("That did not send."));
        dispatch(endWork());
        return;
      }
      ticket = resp.data.ticket as Ticket;
    } catch (err) {
      dispatch(endWork());
      failed("That did not send")(err as JsonError);
      return;
    }

    const missed: string[] = [];
    for (const one of files) {
      try {
        const up = await uploadTicketAttachment(url, token, ticket.id, one);
        if (ticketFailed(up.data)) missed.push(one.name);
      } catch {
        missed.push(one.name);
      }
    }

    dispatch(upsertTicket(ticket));
    dispatch(openNew(false));
    if (missed.length) {
      toast.error(
        `${ticket.ticket_number} was filed, but ${missed.join(", ")} did not upload. Attach it from the ticket.`,
      );
    } else {
      toast.success(`${ticket.ticket_number} is with the help desk`);
    }
    // Opened last, so the pane shows the files already on it.
    if (after) after(ticket);
    else open(ticket.id);
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
        void poll();
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
    canManageTechs,
    rows,
    counts,
    load,
    loadLookups,
    loadAssignees,
    poll,
    pollList,
    applyPending: () => dispatch(applyPending()),
    open,
    file: fileTicket,
    reply,
    assign,
    move,
    attach,
    openAttachment,
  };
};

export type TicketsCtx = ReturnType<typeof useTicketsCtx>;
