import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseReleases } from "@/content/releaseNotes";
import ReleaseNotesPanel from "@/components-dev/releaseNotes/ReleaseNotesPanel";

const releases = parseReleases([
  {
    date: "2026-11-11",
    items: [
      { kind: "new", page: "Item Actions", hrefs: ["item-report"], newPage: true, text: "Suggests the next step for each item." },
      { kind: "new", page: "Sales", hrefs: ["sales"], newPage: false, text: "Each store opens on Summary." },
      { kind: "improvement", page: "Every page", hrefs: [], newPage: false, text: "Pop-ups blur the page behind them." },
      { kind: "fix", page: "Sales", hrefs: ["sales"], newPage: false, text: "Last week lines up after the clock change." },
    ],
    smallerFixes: [
      { page: "Sales", hrefs: ["sales"], count: 3 },
      { page: "Coupons", hrefs: ["coupons"], count: 1 },
    ],
  },
  {
    date: "2026-10-20",
    items: [
      { kind: "improvement", page: "Categories", hrefs: ["categories"], newPage: false, text: "The LW / LY pill names its figures." },
    ],
  },
]);

const show = (href: string, pageName: string | null, onClose = vi.fn()) => {
  render(
    <ReleaseNotesPanel
      releases={releases}
      sample
      href={href}
      pageName={pageName}
      onClose={onClose}
    />,
  );
  return onClose;
};

/** A folded section's toggle, told from the chips by its aria-expanded. */
const findSection = (name: RegExp) =>
  screen
    .queryAllByRole("button", { name })
    .find((b) => b.hasAttribute("aria-expanded")) ?? null;
const section = (name: RegExp) => findSection(name)!;

describe("ReleaseNotesPanel", () => {
  it("opens with the page you came from at the top, its smaller fixes counted", () => {
    show("sales", "Sales");
    const here = within(screen.getByTestId("release-notes-here"));
    expect(here.getByText("You’re here")).toBeTruthy();
    expect(here.getByText("Each store opens on Summary.")).toBeTruthy();
    expect(here.getByText("Last week lines up after the clock change.")).toBeTruthy();
    expect(here.getByText("And 3 smaller fixes.")).toBeTruthy();
    expect(here.queryByText("Pop-ups blur the page behind them.")).toBeNull();
  });

  it("folds each kind to its count until it is opened", async () => {
    show("sales", "Sales");
    const fixes = section(/^Fixes/);
    expect(fixes.getAttribute("aria-expanded")).toBe("false");
    // One fix and the closing smaller-fixes row.
    expect(fixes.textContent).toContain("2");
    await userEvent.click(fixes);
    expect(fixes.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("2 pages")).toBeTruthy();
    expect(screen.getByText("And 4 smaller fixes.")).toBeTruthy();
  });

  it("names a page that is new to production", async () => {
    show("coupons", "Coupons");
    await userEvent.click(section(/^New/));
    expect(screen.getByText("Item Actions · new page")).toBeTruthy();
  });

  it("shows one kind alone, opened, when its chip is picked", async () => {
    show("sales", "Sales");
    await userEvent.click(screen.getByRole("button", { name: "Improvements" }));
    expect(screen.getByRole("button", { name: "Improvements" }).getAttribute("aria-pressed")).toBe("true");
    expect(findSection(/^New/)).toBeNull();
    expect(findSection(/^Fixes/)).toBeNull();
    expect(screen.getByText("Pop-ups blur the page behind them.")).toBeTruthy();
    // Sales has no improvements, so its card steps aside.
    expect(screen.queryByTestId("release-notes-here")).toBeNull();
  });

  it("says when the latest release does not touch the page, and links back", async () => {
    show("categories", "Categories");
    expect(screen.getByText(/Nothing new on Categories this release/)).toBeTruthy();
    await userEvent.click(screen.getByText("Last changed October 20, 2026"));
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("2026-10-20");
    expect(screen.getByTestId("release-notes-here").textContent).toContain(
      "The LW / LY pill names its figures.",
    );
  });

  it("marks the latest release in the picker", () => {
    show("sales", "Sales");
    expect(screen.getByRole("option", { name: "November 11, 2026 · Latest" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "October 20, 2026" })).toBeTruthy();
  });

  it("says it is a sample", () => {
    show("sales", "Sales");
    expect(screen.getByText("Sample notes, for trying the panel")).toBeTruthy();
  });

  it("closes from its button and from Escape, once the slide is done", async () => {
    const onClose = show("sales", "Sales");
    await userEvent.click(screen.getByRole("button", { name: "Close release notes" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    const onEscape = show("sales", "Sales");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onEscape).toHaveBeenCalled());
  });

  it("closes on a click outside it, and stays open for a click inside", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    const onClose = show("sales", "Sales");
    await userEvent.click(section(/^Fixes/));
    await userEvent.selectOptions(screen.getByRole("combobox"), "2026-10-20");
    await new Promise((r) => setTimeout(r, 250));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(outside);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    outside.remove();
  });
});
