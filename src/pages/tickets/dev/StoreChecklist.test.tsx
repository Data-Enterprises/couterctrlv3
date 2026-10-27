import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { TicketStoreOption } from "../../../api/tickets";
import StoreChecklist from "./StoreChecklist";

const option = (
  n: string,
  over: Partial<TicketStoreOption> = {},
): TicketStoreOption => ({
  storeid: Number(n) * 10,
  store_number: n,
  store_name: `S&C Foods ${n}`,
  company: 15,
  company_name: "S&C Foods",
  deactivated: false,
  selected: false,
  ...over,
});

/** The checklist with its state held, the way the forms hold it. */
const Harness = ({
  options,
  searchable = false,
  onState = () => undefined,
}: {
  options: TicketStoreOption[];
  searchable?: boolean;
  onState?: (s: { picked: number[]; notAbout: boolean }) => void;
}) => {
  const [picked, setPicked] = useState<number[]>([]);
  const [notAbout, setNotAbout] = useState(false);
  onState({ picked, notAbout });
  return (
    <StoreChecklist
      options={options}
      picked={picked}
      onPicked={setPicked}
      notAbout={notAbout}
      onNotAbout={setNotAbout}
      searchable={searchable}
    />
  );
};

const last = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls[spy.mock.calls.length - 1][0];

describe("StoreChecklist", () => {
  it("ticking a store takes back Not about a store, and the reverse", async () => {
    const spy = vi.fn();
    render(<Harness options={[option("54"), option("75")]} onState={spy} />);

    await userEvent.click(screen.getByLabelText("Not about a store"));
    expect(last(spy)).toEqual({ picked: [], notAbout: true });

    await userEvent.click(screen.getByText("S&C Foods 54"));
    expect(last(spy)).toEqual({ picked: [540], notAbout: false });

    await userEvent.click(screen.getByLabelText("Not about a store"));
    expect(last(spy)).toEqual({ picked: [], notAbout: true });
  });

  it("marks a closed store, and it can still be ticked", async () => {
    const spy = vi.fn();
    render(
      <Harness options={[option("3", { deactivated: true })]} onState={spy} />,
    );
    expect(screen.getByText("(closed)")).toBeTruthy();
    await userEvent.click(screen.getByText("S&C Foods 3"));
    expect(last(spy).picked).toEqual([30]);
  });

  it("heads each company when the list spans more than one", () => {
    render(
      <Harness
        options={[
          option("54"),
          option("9", { company: 1, company_name: "Houchens" }),
        ]}
      />,
    );
    expect(screen.getByText("Houchens")).toBeTruthy();
    expect(screen.getByText("S&C Foods")).toBeTruthy();
  });

  it("narrows by search without dropping what is already ticked", async () => {
    const spy = vi.fn();
    render(
      <Harness
        options={[option("54"), option("75")]}
        searchable
        onState={spy}
      />,
    );
    await userEvent.click(screen.getByText("S&C Foods 54"));
    await userEvent.type(screen.getByLabelText("Find a store"), "75");
    expect(screen.queryByText("S&C Foods 54")).toBeNull();
    expect(last(spy).picked).toEqual([540]);
    expect(screen.getByText("1 picked")).toBeTruthy();
  });
});
