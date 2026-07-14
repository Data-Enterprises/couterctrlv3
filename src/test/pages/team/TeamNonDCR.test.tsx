import { describe, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { setupStore } from "../../../store";
import Team from "../../../pages/team/TeamLegacy";
import { setCompanies } from "../../../features/userSlice";
import { allUsersResp, nonDCRUserCompanies, qsUserResp, userLvlResp } from ".";
import { getAllUsers } from "../../../api/user";
import { getQuicksightUsers } from "../../../api/quicksight";
import { getUserLevels } from "../../../api/team";

const defaultRender = () => {
  (getAllUsers as Mock).mockResolvedValueOnce(allUsersResp);
  (getQuicksightUsers as Mock).mockResolvedValueOnce(qsUserResp);
  (getUserLevels as Mock).mockResolvedValueOnce(userLvlResp);
  renderWithProviders(<Team />, { store: store });
};

vi.mock("../../../api/quicksight");
vi.mock("../../../api/security");
vi.mock("../../../api/team");
vi.mock("../../../api/user");

const store = setupStore();
store.dispatch(setCompanies(nonDCRUserCompanies));

describe("Team Page Users Form (Non DCR user)", () => {
  it("should filter non DCR users", async () => {
    defaultRender();
  });
});
