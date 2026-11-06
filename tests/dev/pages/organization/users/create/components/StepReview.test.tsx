import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupStore } from "@/store";
import type { BaseGroup } from "@/interfaces";
import { NO_PICKS } from "@/pages/organization/dev/users/utils";
import StepReview from "@/pages/organization/dev/users/create/components/StepReview";

const east: BaseGroup = {
  id: 66,
  name: "East",
  company: 1,
  company_name: "Houchens",
  active: 1,
  mode: "all",
};

describe("Edit's Review", () => {
  it("names a held group whose company was never opened on Assignments", () => {
    render(
      <Provider store={setupStore()}>
        <StepReview
          picks={{ ...NO_PICKS, companies: [1], baseGroups: [66], mode: "all" }}
          companyIds={[1]}
          companyGroups={{}}
          groupStores={{}}
          onGoTo={vi.fn()}
          heldGroups={[east]}
        />
      </Provider>,
    );
    expect(screen.getByText("East")).toBeTruthy();
    expect(screen.queryByText("Group 66")).toBeNull();
  });
});
