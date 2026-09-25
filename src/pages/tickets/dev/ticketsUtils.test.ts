import { describe, expect, it } from "vitest";
import {
  attachmentProblem,
  isMine,
  onTab,
  tabCounts,
  visibleTickets,
  whenText,
} from "./ticketsUtils";
import type { Ticket } from "../../../api/tickets";

const ticket = (over: Partial<Ticket> = {}): Ticket =>
  ({
    id: 19,
    ticket_number: "TCK-19",
    title: "Printer jam at lane 3",
    description: "Stops after about ten receipts.",
    status: "open",
    priority: "normal",
    created_at: "2026-09-24T09:12:00",
    updated_at: "2026-09-24T09:12:00",
    closed_at: null,
    due_at: null,
    opened_by: 517,
    opened_by_username: "snelson",
    opened_by_name: "Stephen Nelson",
    company: 1,
    company_name: "Houchens",
    category_id: null,
    category_name: null,
    assigned_tech_id: null,
    assignee_id: null,
    assigned_tech: null,
    labels: [],
    ...over,
  }) as Ticket;

describe("whose ticket it is", () => {
  it("reads the tech as a users.id, not as a ticket_techs id", () => {
    // The trap the contract calls out: the two ids look alike, and comparing
    // assigned_tech_id happens to work for one tech and fails for the rest.
    const mine = ticket({ assignee_id: 517, assigned_tech_id: 4 });
    expect(isMine(mine, 517)).toBe(true);
    expect(isMine(mine, 4)).toBe(false);
  });

  it("is nobody's when it is unassigned", () => {
    expect(isMine(ticket({ assignee_id: null }), 517)).toBe(false);
  });
});

describe("what each tab shows", () => {
  const rows = [
    ticket({ id: 1, status: "open", assignee_id: null }),
    ticket({ id: 2, status: "in_progress", assignee_id: 517 }),
    ticket({ id: 3, status: "waiting", assignee_id: 42, priority: "urgent" }),
    ticket({ id: 4, status: "closed", assignee_id: 517 }),
  ];

  it("keeps finished work out of the queue", () => {
    // A queue that filled with a year of closed tickets would not be a queue.
    expect(visibleTickets(rows, "all", "", 517).map((t) => t.id)).toEqual([
      1, 2, 3,
    ]);
    expect(visibleTickets(rows, "closed", "", 517).map((t) => t.id)).toEqual([4]);
  });

  it("counts each tab the way the tab filters", () => {
    expect(tabCounts(rows, 517)).toEqual({
      all: 3,
      unassigned: 1,
      mine: 1,
      urgent: 1,
      closed: 1,
    });
  });

  it("does not call a closed ticket mine", () => {
    // Ticket 4 is assigned to 517 and closed — Mine is a work list.
    expect(onTab(rows[3], "mine", 517)).toBe(false);
  });

  it("searches the fields the row already carries, so no call is needed", () => {
    expect(visibleTickets(rows, "all", "TCK-19", 517)).toHaveLength(3);
    expect(visibleTickets(rows, "all", "houchens", 517)).toHaveLength(3);
    expect(visibleTickets(rows, "all", "nothing here", 517)).toHaveLength(0);
  });
});

describe("how long ago", () => {
  const now = Date.parse("2026-09-24T12:00:00Z");
  const ago = (iso: string) => whenText(iso, now);

  it("reads as an age while that is the useful question", () => {
    expect(ago("2026-09-24T11:48:00Z")).toBe("12m");
    expect(ago("2026-09-24T07:00:00Z")).toBe("5h");
    expect(ago("2026-09-23T11:00:00Z")).toBe("yesterday");
  });

  it("becomes a date once an age stops meaning anything", () => {
    // "31h" is not how anybody thinks about last week.
    expect(ago("2026-09-18T11:00:00Z")).toMatch(/Sep/);
  });
});

describe("a file the help desk will not take", () => {
  const limits = { maxBytes: 26214400, extensions: [".png", ".csv"] };
  const file = (name: string, size: number) =>
    ({ name, size }) as File;

  it("turns away the wrong kind before the upload, not after a 413", () => {
    expect(attachmentProblem(file("payload.exe", 100), limits)).toMatch(/\.exe/);
    expect(attachmentProblem(file("shot.png", 100), limits)).toBeNull();
  });

  it("says how big it was, since that is the thing to fix", () => {
    const why = attachmentProblem(file("big.png", 30 * 1024 * 1024), limits);
    expect(why).toMatch(/30\.0 MB/);
    expect(why).toMatch(/25\.0 MB/);
  });
});
