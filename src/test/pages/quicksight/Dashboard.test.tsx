import { describe, it, expect, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import { getEmbedUrl } from "../../../api/quicksight";
import Dashboard from "../../../pages/quicksight/Dashboard";

const successEmbedResponse = {
  data: {
    error: 0,
    embed_url: "fake-embed-url",
    success: true,
  },
};

vi.mock("../../../api/quicksight");
const mockToastError = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => {
  return {
    useToast: () => ({
      error: mockToastError,
    }),
  };
});

describe("Dashboard Page", () => {
  it("should handle api success when fetching embed url", async () => {
    (getEmbedUrl as Mock).mockResolvedValue(successEmbedResponse);
    renderWithProviders(<Dashboard />);
    const page = await screen.findByTestId("dashboard-page");
    expect(page).toBeInTheDocument();
  });

  it("should handle api failure when fetching embed url", async () => {
    (getEmbedUrl as Mock).mockRejectedValue(new Error("API Error"));
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("API Error");
    });
  });
});
