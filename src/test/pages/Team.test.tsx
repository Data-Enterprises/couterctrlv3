import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import { getBaseGroupsAssignedToUser } from "../../api/team";
import Team from "../../pages/team/Team";

const mockedToastError = vi.fn();

vi.mock("../../api/team");
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockedToastError,
  }),
}));

describe("Team Page", () => {

  it("fetches base groups and updates UI and state", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockResolvedValue({
      data: {
        error: 0,
        groups: [{ id: 1, group_name: "Group 1", userid: 1 }],
      },
    });

    renderWithProviders(<Team />);

    await waitFor(() => {
      expect(screen.getByTestId("team-page")).toBeInTheDocument();
      // Assert your Redux state updates here if needed
    });
  });

  it("handles API failure gracefully", async () => {
    (getBaseGroupsAssignedToUser as Mock).mockRejectedValue(
      new Error("Network Error")
    );

    renderWithProviders(<Team />);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledTimes(1);
      expect(mockedToastError).toHaveBeenCalledWith(
        expect.stringContaining("Error fetching base groups")
      );
    });
  });
});
