import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import appReducer, { setIsMobile } from "@/features/appSlice";
import navReducer from "@/features/navSlice";
import { HELP_PAGES, type HelpPage } from "@/constants/helpPages";
import { PHONE_HELP } from "@/components-dev/help/phone";
import InfoModal from "@/components-dev/InfoModal";

const show = (page: HelpPage, mobile: boolean) => {
  const store = configureStore({ reducer: { app: appReducer, nav: navReducer } });
  store.dispatch(setIsMobile(mobile));
  return render(
    <Provider store={store}>
      <InfoModal page={page} isOpen onClose={vi.fn()} />
    </Provider>,
  );
};

describe("InfoModal", () => {
  it("draws the phone help from the repo, with no frame to load", () => {
    const { container } = show("sales", true);
    expect(container.ownerDocument.querySelector("iframe")).toBeNull();
    expect(screen.getByText("Help · Sales")).toBeTruthy();
    expect(screen.getByText("What do TY, LY and LW mean?")).toBeTruthy();
  });

  it("opens one answer at a time", async () => {
    show("sales", true);
    await userEvent.click(screen.getByText("What do TY, LY and LW mean?"));
    expect(screen.getByText(/LW is the week before the one you searched/)).toBeTruthy();
    await userEvent.click(screen.getByText("Can I see units instead of dollars?"));
    expect(screen.queryByText(/LW is the week before the one you searched/)).toBeNull();
    expect(screen.getByText(/Tap Units on the switch/)).toBeTruthy();
  });

  it("searches the questions and the terms", async () => {
    show("vendors", true);
    await userEvent.type(screen.getByLabelText("Search help"), "sold directly");
    expect(screen.getAllByText(/Sold directly to the sub department/).length).toBe(2);
    expect(screen.queryByText("How do I sort the list?")).toBeNull();
    await userEvent.clear(screen.getByLabelText("Search help"));
    await userEvent.type(screen.getByLabelText("Search help"), "zzzz");
    expect(screen.getByText("Nothing here matches “zzzz”.")).toBeTruthy();
  });

  it("falls back to the desktop panel for a page with no phone help", () => {
    show("admin", true);
    expect(screen.getByRole("complementary", { name: "Help" })).toBeTruthy();
  });

  it("gives desktop the panel, even for a page with phone help", () => {
    show("sales", false);
    expect(screen.getByRole("complementary", { name: "Help" })).toBeTruthy();
    expect(screen.queryByText("What do TY, LY and LW mean?")).toBeNull();
  });

  it("files phone help only under real help names, each with something to say", () => {
    for (const [page, help] of Object.entries(PHONE_HELP)) {
      expect(HELP_PAGES).toContain(page);
      expect(help?.questions.length).toBeGreaterThan(0);
    }
    expect(Object.keys(PHONE_HELP).sort()).toEqual([
      "cashiers",
      "categories",
      "coupon-sales",
      "coupons",
      "item-lookup",
      "loss-prevention",
      "orders",
      "receivers",
      "sales",
      "store-groups",
      "sub-dept-margins",
      "vendors",
    ]);
  });
});
