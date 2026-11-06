// Hooks
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  addComment,
  appendComments,
  applyPending,
  refreshHeader,
  setPending,
  endWork,
  failDetail,
  failLoad,
  lostTicket,
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
} from "../../../../features/dev/devTicketsSlice";

// API
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
  setTicketStores,
  ticketFailed,
  uploadTicketAttachment,
  type Ticket,
  type TicketDetailResp,
  type TicketListResp,
  type TicketPriority,
  type TicketStatus,
} from "../../../../api/tickets";

// Utils
import {
  sendFailureText,
  visibleTickets,
  tabCounts,
} from "../utils/ticketsUtils";

// Interfaces
import type { JsonError } from "../../../../interfaces";

/** The HTTP status of a failed call, from axios or from a test double. */
const statusOf = (err: unknown) =>
  (err as { response?: { status?: number } })?.response?.status ??
  (err as { status?: number })?.status;

/**
 * Everything the Client Help Desk needs, in one hook. Dev-only, so every call
 * goes through `useDevApi`, never `app.url`.
 */
export const useTicketsCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useDevApi();
  const toast = useToast();
  const tickets = useAppSelector((state) => state.dev.tickets);
  const userid = useAppSelector((state) => state.user.userid);

  /**
   * Which view this is: both flags come back on every response, and there is
   * no client-side override.
   */
  const isTech = tickets.caps.canViewAll;
  const canManage = tickets.caps.canManage;
  // The roster. Level 9 and nothing less, so that a desk nobody is on is
  // always fixable by somebody.
  const canManageTechs = tickets.caps.canManageTechs;

  /**
   * What this reader may see is what the server sent. No company filter here:
   * a Manager legitimately sees other companies' tickets naming their stores.
   */
  const scoped = tickets.tickets;

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

  /** The queue, and the pickers behind it. The list and the lookups go out
   *  together; the assignees wait for the list to say who is asking. */
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
            scope: j.scope ?? null,
          }),
        );
        // Only someone who can assign asks for the techs; anyone else would
        // get a 403 on every load.
        if (j.canManage) loadAssignees();
      })
      .catch(failed("Could not read the tickets"));

    loadLookups();
  };

  /**
   * The pickers on their own (categories and attachment limits), for filing
   * from another page without pulling the whole queue.
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
   * Open one. The detail carries the thread, files and both flags in one call.
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
            scope: j.scope ?? null,
          }),
        );
      })
      .catch((err: JsonError) => {
        // Gone from this reader's view between the list and the click.
        if (statusOf(err) === 404) dispatch(lostTicket(id));
        else failed("Could not open that ticket")(err);
      });
  };

  /**
   * Ask what is new on the open ticket. `since` trims the thread; the ticket
   * comes back whole. Never touches `working` or the composer.
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
        // Files are replaced, not appended: attaching writes no comment, so
        // `since` alone would never bring a new file in.
        if (j.attachments) dispatch(setAttachments(j.attachments));
      })
      .catch((err) => {
        // A 404 means the ticket has left this reader's view, so polling stops.
        if (statusOf(err) === 404) dispatch(lostTicket(id));
        /* Anything else is the next poll's problem. */
      });
  };

  /**
   * Ask what is new in the queue, and hold it: applying it would reorder rows
   * under the reader's cursor, so it is offered rather than taken.
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
        // Whether anything moved is decided in the reducer: this interval's
        // closure holds the list it started with.
        dispatch(setPending(j.tickets));
      })
      .catch(() => {
        /* Same: the next one will ask again. */
      });
  };

  /**
   * File one, then upload each file to it in turn. The ticket exists once the
   * create returns, so a failed upload says it is filed and names the file.
   */
  const fileTicket = async (
    body: {
      title: string;
      description: string;
      priority?: TicketPriority;
      category_id?: number | null;
      /** `[]` is "Not about a store". */
      storeids?: number[];
    },
    files: File[] = [],
    /**
     * What to do once it is filed, when opening it is not the answer: a report
     * filed from another page closes its own modal instead.
     */
    after?: (ticket: Ticket) => void,
  ): Promise<string | null> => {
    // Returns why it did not send, or null once it has; the form shows it
    // under its own Send button.
    dispatch(startWork());
    let ticket: Ticket;
    try {
      const resp = await createTicket(url, token, body);
      if (ticketFailed(resp.data) || !resp.data.ticket) {
        dispatch(endWork());
        return "That did not send.";
      }
      ticket = resp.data.ticket as Ticket;
    } catch (err) {
      dispatch(endWork());
      return sendFailureText(err);
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
    return null;
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
   * Move it. Only closing can reach `closed`, and it carries the resolution
   * the modal collects.
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

  /**
   * Replace the open ticket's stores (techs only). Returns why it did not
   * save, or null; polls straight away so the server's note shows up.
   */
  const setStores = async (storeids: number[]): Promise<string | null> => {
    const id = tickets.selectedId;
    if (!id) return null;
    dispatch(startWork());
    try {
      const resp = await setTicketStores(url, token, id, storeids);
      if (ticketFailed(resp.data) || !resp.data.ticket) {
        dispatch(endWork());
        return "Those stores did not save.";
      }
      dispatch(upsertTicket(resp.data.ticket as Ticket));
      if (resp.data.changed) void poll();
      return null;
    } catch (err) {
      dispatch(endWork());
      const status = statusOf(err);
      if (status === 404) {
        dispatch(lostTicket(id));
        return null;
      }
      return status === 403
        ? "Changing a ticket's stores needs a ticket tech's account."
        : sendFailureText(err).replace(
            "That did not send",
            "That did not save",
          );
    }
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
    setStores,
  };
};

export type TicketsCtx = ReturnType<typeof useTicketsCtx>;
