import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import CashiersHeader from "@/pages/cashiers/prod/components/CashiersHeader";

/*
 * The Cashiers results header carries the page's "?", so its help can be
 * opened from the desktop screen.
 */

describe("Cashiers' results header", () => {
  it("has the help button", () => {
    render(
      <Provider store={setupStore()}>
        <CashiersHeader
          scopeLabel="Chapel Hill"
          startDate="11/16/2026"
          endDate="11/22/2026"
          exception="Void"
          truncated={0}
          onBack={() => {}}
          onExport={() => {}}
        />
      </Provider>,
    );
    expect(screen.getByRole("button", { name: "About Cashiers" })).toBeTruthy();
  });
});
