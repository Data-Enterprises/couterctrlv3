import { describe, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import ItemLookup from "../../../pages/lookup/ItemLookup";
import { setupStore } from "../../../store";

import { getAllUsers } from "../../../api/user";
import { allUsersResp } from ".";

const store = setupStore();
vi.mock("../../../api/user");

describe("Item Lookup page", () => {
  it("should render Item Lookup page", () => {
    (getAllUsers as Mock).mockResolvedValueOnce({ data: allUsersResp });
    renderWithProviders(<ItemLookup />, { store });
  });
});
