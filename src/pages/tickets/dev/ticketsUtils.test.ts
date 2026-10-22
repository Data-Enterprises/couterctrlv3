import { describe, expect, it } from "vitest";
import {
  attachmentProblem,
  isMine,
  matchesFilters,
  onTab,
  parseServerTime,
  resolutionLabel,
  sendFailureText,
  tabCounts,
  ticketsInScope,
  visibleTickets,
  whenText,
} from "./ticketsUtils";
import type { Ticket } from "../../../api/tickets";
import {
  noFilters,
  type TicketFilters,
} from "../../../features/dev/devTicketsSlice";

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

describe("the column filters", () => {
  const rows = [
    ticket({ id: 1, status: "open", company_name: "Houchens", priority: "high", assigned_tech: null, opened_by_name: "Mike Bedingfield" }),
    ticket({ id: 2, status: "in_progress", company_name: "Grocery Basket", priority: "normal", assigned_tech: "Mike Tech", opened_by_name: "Admin Chick" }),
    ticket({ id: 3, status: "waiting", company_name: "Food Giant", priority: "urgent", assigned_tech: "Stephen Tech", opened_by_name: "Manager Chick" }),
  ];
  const filters = (over: Partial<TicketFilters> = {}): TicketFilters => ({
    ...noFilters,
    ...over,
  });

  it("treats an untouched column as every row, not none", () => {
    expect(rows.filter((t) => matchesFilters(t, filters()))).toHaveLength(3);
  });

  it("narrows on a list, and on text, case-insensitively", () => {
    expect(
      rows.filter((t) => matchesFilters(t, filters({ status: ["waiting"] }))),
    ).toHaveLength(1);
    expect(
      rows.filter((t) => matchesFilters(t, filters({ company: "grocery" }))),
    ).toHaveLength(1);
  });

  it("finds the unassigned by the word the column shows", () => {
    // The cell says "Unassigned", so that is what someone types looking for
    // one — the row has null there.
    const found = rows.filter((t) =>
      matchesFilters(t, filters({ assignee: "unassigned" })),
    );
    expect(found.map((t) => t.id)).toEqual([1]);
  });

  it("ands the columns together", () => {
    expect(
      rows.filter((t) =>
        matchesFilters(t, filters({ status: ["open"], company: "Food Giant" })),
      ),
    ).toHaveLength(0);
  });
});

describe("files chosen before the ticket exists", () => {
  const limits = { maxBytes: 26214400, extensions: [".png", ".csv"] };
  const file = (name: string, size = 100) => ({ name, size }) as File;

  /** What the modal does with a FileList: drop what cannot go, then
   *  de-duplicate, since a picker can be opened again and again. */
  const add = (have: File[], chosen: File[]) => {
    const good = chosen.filter((f) => !attachmentProblem(f, limits));
    const names = new Set(have.map((f) => f.name));
    return [...have, ...good.filter((f) => !names.has(f.name))];
  };

  it("keeps the ones the endpoint would take", () => {
    const kept = add([], [file("lane3.png"), file("payload.exe")]);
    expect(kept.map((f) => f.name)).toEqual(["lane3.png"]);
  });

  it("does not add the same file twice", () => {
    const once = add([], [file("lane3.png")]);
    expect(add(once, [file("lane3.png")])).toHaveLength(1);
  });
});

describe("what kind of fix closed it", () => {
  it("reads the reserved label closing wrote", () => {
    // resolution_type has no column — it is stored as a type: label, which
    // the lookups hide from the picker because nobody chooses it by hand.
    const closed = ticket({
      status: "closed",
      labels: [
        { id: 1, name: "Feature Request", color: "blue" },
        { id: 2, name: "type:user_error", color: "grey" },
      ],
    });
    expect(resolutionLabel(closed)).toBe("User error");
  });

  it("says nothing when the ticket carries no such label", () => {
    expect(resolutionLabel(ticket({ labels: [] }))).toBeNull();
  });
});

describe("ticketsInScope", () => {
  // The dev review's case: user 649 holds Bruces (3), and a DCR user who holds
  // Houchens (1) and Bruces opens tickets that report company 1.
  const BRUCES = [3];
  const mine = ticket({ id: 35, opened_by: 649, company: 3 });
  const houchens = ticket({ id: 30, opened_by: 12, company: 1 });
  const bruces = ticket({ id: 31, opened_by: 40, company: 3 });

  it("keeps a customer to their own company's tickets", () => {
    const seen = ticketsInScope([mine, houchens, bruces], false, BRUCES, 649);
    expect(seen.map((t) => t.id)).toEqual([35, 31]);
  });

  it("always shows a ticket the reader opened", () => {
    // A user with no company at all would otherwise see an empty page.
    const orphan = ticket({ id: 36, opened_by: 649, company: null });
    expect(ticketsInScope([orphan], false, [], 649)).toHaveLength(1);
  });

  it("hides a ticket with no company that somebody else opened", () => {
    const stray = ticket({ id: 37, opened_by: 40, company: null });
    expect(ticketsInScope([stray], false, BRUCES, 649)).toHaveLength(0);
  });

  it("lets a tech see everything", () => {
    expect(ticketsInScope([mine, houchens, bruces], true, [], 1)).toHaveLength(3);
  });

  it("counts only what is in scope", () => {
    // Tab counts read the scoped list, so "Open 14" can't include tickets
    // the customer will never be shown.
    const scoped = ticketsInScope([mine, houchens, bruces], false, BRUCES, 649);
    expect(tabCounts(scoped, 649).all).toBe(2);
  });
});

describe("parseServerTime", () => {
  // TCK-35: sent 5:32 PM CDT, which is 22:32 UTC. The API sends the UTC clock
  // time with no zone, and it used to be read as local -- five hours ahead.
  const sent = "2026-10-21T22:32:10.299190";

  it("reads a zone-less stamp as UTC", () => {
    expect(new Date(parseServerTime(sent)).toISOString()).toBe(
      "2026-10-21T22:32:10.299Z",
    );
  });

  it("leaves a stamp that names its zone alone", () => {
    expect(parseServerTime("2026-10-21T22:32:10Z")).toBe(
      Date.parse("2026-10-21T22:32:10Z"),
    );
    expect(parseServerTime("2026-10-21T17:32:10-05:00")).toBe(
      Date.parse("2026-10-21T22:32:10Z"),
    );
  });

  it("puts a ticket from five minutes ago five minutes ago", () => {
    // Before the fix this read as five hours in the future, shown "just now".
    const now = Date.parse("2026-10-21T22:37:11Z");
    expect(whenText(sent, now)).toBe("5m");
  });
});

describe("sendFailureText", () => {
  const NO_COMPANY =
    "Your account is not assigned to a company yet, so a ticket has nowhere to be filed. Ask a manager to assign one.";

  it("shows a no-company user the server's own sentence", () => {
    const err = { response: { status: 400, data: { detail: NO_COMPANY } } };
    expect(sendFailureText(err)).toBe(NO_COMPANY);
  });

  it("does not read out a detail from anything but a 400", () => {
    const err = {
      message: "Request failed with status code 500",
      response: { status: 500, data: { detail: "Traceback (most recent call last)" } },
    };
    expect(sendFailureText(err)).toBe(
      "That did not send: Request failed with status code 500",
    );
  });

  it("falls back when there is nothing to say", () => {
    expect(sendFailureText({ response: { status: 400, data: {} } })).toBe(
      "That did not send.",
    );
    expect(sendFailureText(undefined)).toBe("That did not send.");
  });
});
