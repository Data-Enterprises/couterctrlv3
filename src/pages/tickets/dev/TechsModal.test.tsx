import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { setupStore } from "../../../store";
import * as api from "../../../api/tickets";
import type { TechCandidate, TicketTech } from "../../../api/tickets";
import TechsModal from "./TechsModal";

vi.mock("../../../api/tickets", async (orig) => ({
  ...(await orig<typeof api>()),
  listTicketTechs: vi.fn(),
  listTechCandidates: vi.fn(),
  createTicketTech: vi.fn(),
  updateTicketTech: vi.fn(),
}));

vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: () => {},
    success: () => {},
    info: () => {},
    warning: () => {},
    warn: () => {},
  }),
}));

const tech = (over: Partial<TicketTech> = {}): TicketTech => ({
  tech_id: 1,
  userid: 11,
  tech_code: "T1",
  display_name: null,
  is_active: true,
  created_at: "2026-10-01T00:00:00Z",
  username: "snelson",
  user_level: 9,
  user_active: 1,
  name: "Stephen Nelson",
  ticket_count: 0,
  ...over,
});

const candidate = (over: Partial<TechCandidate> = {}): TechCandidate => ({
  userid: 44,
  username: "jlane",
  email: "jlane@dcrpos.com",
  user_level: 7,
  name: "J Lane",
  was_a_tech: false,
  previous_tech_code: null,
  ...over,
});

const answer = (body: Record<string, unknown>) =>
  Promise.resolve({ data: { error: 0, success: true, ...body } });

const show = (
  techs: TicketTech[],
  opts: { canManageTechs?: boolean; candidates?: TechCandidate[] } = {},
) => {
  vi.mocked(api.listTicketTechs).mockReturnValue(
    answer({ count: techs.length, techs }) as never,
  );
  vi.mocked(api.listTechCandidates).mockReturnValue(
    answer({
      count: (opts.candidates ?? []).length,
      candidates: opts.candidates ?? [],
    }) as never,
  );
  return render(
    <Provider store={setupStore()}>
      <TechsModal
        canManageTechs={opts.canManageTechs ?? false}
        onClose={() => {}}
        onChanged={() => {}}
      />
    </Provider>,
  );
};

beforeEach(() => vi.clearAllMocks());

/**
 * Which face the sheet wears.
 *
 * One component, two readers. A tech is looking something up; a programmer is
 * changing it. The difference has to be the server's flag and nothing else —
 * a user level read in the browser would be a second rule, and the two would
 * disagree the first time a level moved.
 */
describe("the two faces", () => {
  it("is a read-only list of who is on the desk for a tech", async () => {
    show([tech(), tech({ tech_id: 2, username: "gone", is_active: false })], {
      canManageTechs: false,
    });

    expect(await screen.findByText("On the desk")).toBeTruthy();
    expect(screen.queryByText("Ticket techs")).toBeNull();
    // Nothing that changes anything: no switches, no Add.
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Add a tech" })).toBeNull();
    // And the desk means the people on it. A stood-down tech is roster
    // maintenance, which is not what this reader came for.
    expect(screen.queryByText("gone")).toBeNull();
  });

  it("is the roster for a programmer, stood-down techs included", async () => {
    show([tech(), tech({ tech_id: 2, username: "gone", is_active: false })], {
      canManageTechs: true,
    });

    expect(await screen.findByText("Ticket techs")).toBeTruthy();
    expect(screen.getByText("gone")).toBeTruthy();
    // One per row, because bringing somebody back is half the job.
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(
      screen.getByRole("checkbox", { name: "Bring gone back" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a tech" })).toBeTruthy();
  });

  it("asks for the candidates only when they could be used", async () => {
    show([tech()], { canManageTechs: false });
    await screen.findByText("On the desk");
    expect(api.listTechCandidates).not.toHaveBeenCalled();
  });
});

/**
 * The one failure the roster cannot fix.
 *
 * A tech row and the account behind it are two records. Disabling the login
 * leaves the row on the desk: tickets still route to them and they cannot
 * open one. Hiding the row would hide the problem — tickets would pile up on
 * somebody who, as far as this screen said, did not exist.
 */
describe("a tech whose login is off", () => {
  it("is flagged on the desk rather than left out of it", async () => {
    show([tech({ user_active: 0 })], { canManageTechs: false });

    expect(await screen.findByText("snelson")).toBeTruthy();
    expect(screen.getByText("no sign-in")).toBeTruthy();
  });
});

/** Rows lead with the username: it is unique, it is what a log carries, and
 *  it assumes nothing about who somebody is. The display name keeps the
 *  second line, where recognising a colleague still works. */
describe("how a row names somebody", () => {
  it("leads with the username and keeps the display name beside the code", async () => {
    show([tech({ display_name: "Steve", name: "Steve" })], {
      canManageTechs: true,
    });

    expect(await screen.findByText("snelson")).toBeTruthy();
    expect(screen.getByText(/T1 · Steve/)).toBeTruthy();
  });
});

describe("standing a tech down", () => {
  it("says what happens to their open work and offers to hand it over", async () => {
    const user = userEvent.setup();
    show(
      [
        tech({ ticket_count: 4 }),
        tech({ tech_id: 2, userid: 22, username: "mreed", ticket_count: 1 }),
      ],
      { canManageTechs: true },
    );

    await user.click(
      await screen.findByRole("checkbox", { name: "Stand snelson down" }),
    );

    // The count the roster showed, said again where the decision is made.
    expect(screen.getByText(/4 open tickets/)).toBeTruthy();
    expect(screen.getByText(/anything left with them stops moving/)).toBeTruthy();

    // The other active tech is the hand-over, and leaving it is a real
    // answer rather than an empty field.
    await user.click(
      screen.getByRole("button", { name: /Hand them to/ }),
    );
    expect(screen.getByText("mreed · holding 1")).toBeTruthy();

    // Nothing has been written yet: the switch asks, it does not act.
    expect(api.updateTicketTech).not.toHaveBeenCalled();
  });

  it("warns that a desk with nobody on it notifies nobody", async () => {
    const user = userEvent.setup();
    show([tech({ ticket_count: 2 })], { canManageTechs: true });

    await user.click(
      await screen.findByRole("checkbox", { name: "Stand snelson down" }),
    );

    expect(screen.getByText("They are the last active tech.")).toBeTruthy();
    expect(screen.getByText(/notifies no one/)).toBeTruthy();
    // With nobody else active there is nowhere to hand the work, so the
    // picker is not drawn — an empty one would read as an option.
    expect(screen.getByText(/nobody to hand their work to/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Hand them to/ }),
    ).toBeNull();
  });

  it("sends the hand-over with the stand-down, as one change", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateTicketTech).mockReturnValue(
      answer({ reassigned: 4, reassigned_to: 22 }) as never,
    );
    show(
      [
        tech({ ticket_count: 4 }),
        tech({ tech_id: 2, userid: 22, username: "mreed", ticket_count: 1 }),
      ],
      { canManageTechs: true },
    );

    await user.click(
      await screen.findByRole("checkbox", { name: "Stand snelson down" }),
    );
    await user.click(
      screen.getByRole("button", { name: /Hand them to/ }),
    );
    await user.click(screen.getByRole("button", { name: "mreed · holding 1" }));
    await user.click(screen.getByRole("button", { name: "Stand down" }));

    // reassign_to is the users.id, not the tech_id — they are different
    // numbers and the endpoint takes the former.
    // url and token lead every call in this file and are the same pair for
    // all of them; what matters is which row and what it was told to do.
    expect(vi.mocked(api.updateTicketTech).mock.calls[0].slice(2)).toEqual([
      1,
      { is_active: false, reassign_to: 22 },
    ]);
  });

  it("leaves reassign_to out when the work is staying put", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateTicketTech).mockReturnValue(
      answer({ open_tickets_still_assigned: 4 }) as never,
    );
    show([tech({ ticket_count: 4 })], { canManageTechs: true });

    await user.click(
      await screen.findByRole("checkbox", { name: "Stand snelson down" }),
    );
    await user.click(screen.getByRole("button", { name: "Stand down" }));

    expect(vi.mocked(api.updateTicketTech).mock.calls[0].slice(2)).toEqual([
      1,
      { is_active: false },
    ]);
  });

  it("brings somebody back without asking, because nothing is at stake", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateTicketTech).mockReturnValue(
      answer({ tech: tech({ tech_id: 2, username: "gone" }) }) as never,
    );
    show([tech({ tech_id: 2, username: "gone", is_active: false })], {
      canManageTechs: true,
    });

    await user.click(
      await screen.findByRole("checkbox", { name: "Bring gone back" }),
    );

    expect(vi.mocked(api.updateTicketTech).mock.calls[0].slice(2)).toEqual([
      2,
      { is_active: true },
    ]);
  });
});

describe("adding a tech", () => {
  it("says a returning tech is being brought back, not added twice", async () => {
    const user = userEvent.setup();
    show([tech()], {
      canManageTechs: true,
      candidates: [
        candidate({ was_a_tech: true, previous_tech_code: "T7" }),
        candidate({ userid: 45, username: "bkerr", name: "B Kerr" }),
      ],
    });

    await user.click(await screen.findByRole("button", { name: "Add a tech" }));
    await user.click(screen.getByRole("button", { name: "Who" }));
    // By its own text, not by role: the trigger lives inside the label, so
    // the open list's options end up in the trigger's accessible name too.
    await user.click(screen.getByText("jlane · J Lane · was a tech"));

    expect(screen.getByText("jlane was a tech before.")).toBeTruthy();
    expect(screen.getByText(/T7/)).toBeTruthy();
    expect(screen.getByText(/rather than making a second one/)).toBeTruthy();
    // The button says which of the two things the press does.
    expect(screen.getByRole("button", { name: "Bring back" })).toBeTruthy();
  });

  it("sends only the fields that were filled in", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createTicketTech).mockReturnValue(
      answer({ created: true, tech: tech({ username: "bkerr" }) }) as never,
    );
    show([tech()], {
      canManageTechs: true,
      candidates: [candidate({ userid: 45, username: "bkerr", name: "B Kerr" })],
    });

    await user.click(await screen.findByRole("button", { name: "Add a tech" }));
    await user.click(screen.getByRole("button", { name: "Who" }));
    await user.click(screen.getByText("bkerr · B Kerr"));
    await user.click(screen.getByRole("button", { name: "Add" }));

    // No display name and no code typed, so the server picks both — sending
    // empty strings would store an empty code rather than the next one.
    expect(vi.mocked(api.createTicketTech).mock.calls[0].slice(2)).toEqual([
      { userid: 45 },
    ]);
  });

  it("cannot be pressed before somebody is picked", async () => {
    const user = userEvent.setup();
    show([tech()], { canManageTechs: true, candidates: [candidate()] });

    await user.click(await screen.findByRole("button", { name: "Add a tech" }));
    expect(screen.getByRole("button", { name: "Add" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
