import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssignPanel from "./AssignPanel";

/**
 * "Assign all" has to mean what the column says.
 *
 * The Companies tab narrows its candidate column with a company dropdown and
 * passes `assignAllScope="global"`, which was reading the whole unfiltered
 * array. The heading said "1 of 372" and the button next to it would have
 * written 372 rows.
 */
const ITEMS = [
  { id: 1, label: "ann", sublabel: "ann@houchens.com" },
  { id: 2, label: "bob", sublabel: "bob@bandt.com" },
  { id: 3, label: "cal", sublabel: "cal@houchens.com" },
];

const onHouchens = (i: { id: number }) => i.id !== 2;

const setup = (props: Partial<Parameters<typeof AssignPanel>[0]> = {}) => {
  const onAssign = vi.fn();
  render(
    <AssignPanel
      leftTitle="Not in this company"
      rightTitle="In this company"
      leftItems={ITEMS}
      rightItems={[]}
      onAssign={onAssign}
      onUnassign={vi.fn()}
      {...props}
    />,
  );
  return { onAssign };
};

describe("AssignPanel — Assign all", () => {
  it("assigns only what the caller's scope leaves, even when global", () => {
    const { onAssign } = setup({
      assignAllScope: "global",
      leftPredicate: onHouchens,
    });
    screen.getByText("Assign all").click();
    expect(onAssign).toHaveBeenCalledWith([1, 3]);
  });

  it("still steps over the search box when global", () => {
    // The point of "global": somebody typing to find one person has not
    // decided to narrow the write. Legacy parity, and deliberately kept.
    const { onAssign } = setup({ assignAllScope: "global" });
    screen.getByText("Assign all").click();
    expect(onAssign).toHaveBeenCalledWith([1, 2, 3]);
  });

  it("obeys both when filtered", async () => {
    const user = userEvent.setup();
    const { onAssign } = setup({
      assignAllScope: "filtered",
      leftPredicate: onHouchens,
    });
    await user.type(screen.getAllByPlaceholderText(/search/i)[0], "cal");
    screen.getByText("Assign all").click();
    expect(onAssign).toHaveBeenCalledWith([3]);
  });

  it("is disabled when the scope leaves nobody", () => {
    setup({ assignAllScope: "global", leftPredicate: () => false });
    expect(screen.getByText("Assign all")).toBeDisabled();
  });

  it("counts the heading off the same scope the reader sees", () => {
    setup({ assignAllScope: "global", leftPredicate: onHouchens });
    expect(
      screen.getByText(/Not in this company \(2 of 3\)/i),
    ).toBeInTheDocument();
  });
});
