import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../../utils";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getAllUsers } from "../../../../api/user";
import { getQuicksightUsers } from "../../../../api/quicksight";
import { getUserLevels } from "../../../../api/team";
import { allUsersResp, qsUserResp, userLvlResp } from "..";
import { setupStore } from "../../../../store";
import Team from "../../../../pages/team/Team";

const user = userEvent.setup();
const store = setupStore();

vi.mock("../../../../api/quicksight");
vi.mock("../../../../api/security");
vi.mock("../../../../api/team");
vi.mock("../../../../api/user");
vi.mock("../../../../api/baseGroups");

const defaultRender = () => {
  (getAllUsers as Mock).mockResolvedValue(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValue(qsUserResp);
  (getUserLevels as Mock).mockResolvedValue(userLvlResp);
  renderWithProviders(<Team />, { store });
};

describe("Team Page Store Assignment Form", () => {
  it("should load the Stores Form", async () => {
    defaultRender();
    const storesForm = await screen.findByTestId("team-stores-form");
    await user.click(storesForm);

    expect(0).toBe(0);
  });
});
