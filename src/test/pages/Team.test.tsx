import { describe, it, expect, vi, type Mocked } from "vitest";
import { renderWithProviders } from "../utils";
import { screen, waitFor } from "@testing-library/react";
import { store } from "../../store";
import Team from "../../pages/team/Team";
import type { Group } from "../../features/groupSlice";
import axios from "axios";

vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;

const mockDispatch = vi.fn();
// Re-mock hooks using the actual store
vi.mock("../../hooks", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(store.getState()),
}));

const mockToastError = vi.fn();
vi.mock("../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    error: mockToastError,
  }),
}));

describe("Team Page", () => {
  it("should render with main components", () => {
    renderWithProviders(<Team />);
    const team = screen.getByTestId("team-page");
    expect(team).toBeInTheDocument();
  });

  it("should dispatch fetch action on mount", () => {
    renderWithProviders(<Team />);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("should display a toast error if API call fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

    renderWithProviders(<Team />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

it("should dispatch setBaseGroups on successful API call", async () => {
  const mockGroups: Group[] = [{ id: 1, group_name: "Group A", userid: 517 }];
  mockedAxios.get.mockResolvedValueOnce({
    data: { error: 0, groups: mockGroups },
  });

  renderWithProviders(<Team />);
  await waitFor(() => {
    expect(mockDispatch).toHaveBeenCalled();
  });
});
});
