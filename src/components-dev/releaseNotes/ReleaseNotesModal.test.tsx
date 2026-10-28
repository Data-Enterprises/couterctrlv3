import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import navReducer from "../../features/navSlice";
import { parseReleases } from "../../content/releaseNotes";
import ReleaseNotesModal from "./ReleaseNotesModal";

const releases = parseReleases([
  {
    date: "2026-11-02",
    platform: ["Hash sales"],
    updates: [
      { page: "Config → User Management", hrefs: ["user-management"], bullets: ["Access type"] },
    ],
    fixes: [
      { page: "Config → User Management", hrefs: ["user-management"], bullets: ["Edit saves"] },
    ],
  },
  {
    date: "2026-10-20",
    updates: [{ page: "Performance → Sales", hrefs: ["sales"], bullets: ["Top 200"] }],
  },
]);

const show = (href: string, pageName: string | null) =>
  render(
    <Provider store={configureStore({ reducer: { nav: navReducer } })}>
      <ReleaseNotesModal
        releases={releases}
        sample
        href={href}
        pageName={pageName}
        onClose={vi.fn()}
      />
    </Provider>,
  );

describe("ReleaseNotesModal", () => {
  it("draws only the sections a release has", () => {
    show("user-management", "User Management");
    const heading = (name: string) =>
      screen.queryByRole("heading", { level: 4, name });
    expect(heading("Platform Updates")).toBeTruthy();
    expect(heading("Updates")).toBeTruthy();
    expect(heading("Fixes")).toBeTruthy();
    expect(heading("Now available")).toBeNull();
    // The summary under the date names the same three, and not the fourth.
    expect(screen.queryByText("Now available")).toBeNull();
  });

  it("marks the page you came from in every section it appears in", () => {
    show("user-management", "User Management");
    expect(screen.getAllByText("This page")).toHaveLength(2);
  });

  it("says when the latest release does not touch the page, and links back", async () => {
    show("sales", "Sales");
    expect(screen.getByText(/Nothing new on Sales this release/)).toBeTruthy();
    await userEvent.click(screen.getByText("Last changed October 20, 2026"));
    expect(screen.getByText("October 20, 2026")).toBeTruthy();
    expect(screen.getByText("Top 200")).toBeTruthy();
    expect(screen.getAllByText("This page")).toHaveLength(1);
  });

  it("makes each pill a jump to its section, and marks the one chosen", async () => {
    show("user-management", "User Management");
    const pills = screen.getByRole("navigation", { name: "Sections" });
    const fixes = Array.from(pills.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Fixes"),
    )!;
    await userEvent.click(fixes);
    expect(fixes.getAttribute("aria-current")).toBe("true");
  });

  it("says it is a sample", () => {
    show("sales", "Sales");
    expect(screen.getByText("Sample notes, for trying the window")).toBeTruthy();
  });
});
