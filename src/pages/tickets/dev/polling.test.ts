import { describe, expect, it } from "vitest";
import reducer, {
  addComment,
  appendComments,
  applyPending,
  initialState,
  refreshHeader,
  selectTicket,
  setDetail,
  setPending,
  setTickets,
  startWork,
} from "../../../features/dev/devTicketsSlice";
import type { Ticket, TicketComment } from "../../../api/tickets";

const comment = (id: number): TicketComment =>
  ({
    id,
    ticket_id: 19,
    userid: 517,
    comment: `message ${id}`,
    is_internal: false,
    created_at: "2026-09-25T09:00:00",
    author_username: "snelson",
    author_name: "Stephen Nelson",
  }) as TicketComment;

const ticket = (over: Partial<Ticket> = {}): Ticket =>
  ({
    id: 19,
    ticket_number: "TCK-19",
    title: "Printer jam at lane 3",
    status: "open",
    priority: "normal",
    updated_at: "2026-09-25T09:00:00",
    assignee_id: null,
    assigned_tech: null,
    labels: [],
    ...over,
  }) as Ticket;

const opened = () =>
  reducer(
    reducer(initialState, selectTicket(19)),
    setDetail({
      ticket: ticket(),
      comments: [comment(21), comment(22)],
      caps: { canViewAll: true, canManage: true },
    }),
  );

describe("the high-water mark a poll asks from", () => {
  it("starts at the newest comment the thread arrived with", () => {
    expect(opened().lastCommentId).toBe(22);
  });

  it("rises when your own reply comes back, so the poll cannot repeat it", () => {
    // The POST hands the comment back and it is on screen at once. Without
    // raising the mark here the next poll would hand it over a second time.
    const after = reducer(opened(), addComment(comment(23)));
    expect(after.lastCommentId).toBe(23);
    expect(after.comments).toHaveLength(3);
  });

  it("drops anything it already has, since a reply and a poll can cross", () => {
    const after = reducer(
      reducer(opened(), addComment(comment(23))),
      appendComments([comment(23), comment(24)]),
    );
    expect(after.comments.map((c) => c.id)).toEqual([21, 22, 23, 24]);
    expect(after.lastCommentId).toBe(24);
  });

  it("forgets the mark when a different ticket is opened", () => {
    expect(reducer(opened(), selectTicket(20)).lastCommentId).toBe(0);
  });
});

describe("a poll is not a piece of work", () => {
  it("leaves a reply's spinner alone while it updates the header", () => {
    // refreshHeader must never clear `working` — somebody's reply is still
    // in flight behind it.
    const sending = reducer(opened(), startWork());
    const polled = reducer(
      sending,
      refreshHeader(ticket({ status: "in_progress", assigned_tech: "Mike" })),
    );
    expect(polled.working).toBe(true);
    expect(polled.detail?.status).toBe("in_progress");
  });

  it("does not disturb the thread", () => {
    const polled = reducer(opened(), refreshHeader(ticket({ status: "waiting" })));
    expect(polled.comments).toHaveLength(2);
  });
});

describe("the queue is offered, not applied", () => {
  const listed = reducer(
    initialState,
    setTickets({
      tickets: [ticket({ id: 1 }), ticket({ id: 2 })],
      caps: { canViewAll: true, canManage: true },
    }),
  );

  it("holds what a poll found rather than reordering under the reader", () => {
    const held = reducer(listed, setPending([ticket({ id: 3 }), ticket({ id: 1 })]));
    // Nothing has moved yet — that is the whole point.
    expect(held.tickets.map((t) => t.id)).toEqual([1, 2]);
    expect(held.pending).toHaveLength(2);
  });

  it("reorders only when somebody asks it to", () => {
    const applied = reducer(
      reducer(listed, setPending([ticket({ id: 3 }), ticket({ id: 1 })])),
      applyPending(),
    );
    expect(applied.tickets.map((t) => t.id)).toEqual([3, 1]);
    expect(applied.pending).toBeNull();
  });
});
