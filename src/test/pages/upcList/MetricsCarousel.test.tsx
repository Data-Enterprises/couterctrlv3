import { describe, expect, it } from "vitest";
import MetricsCarousel from "../../../pages/upc/modules/forecast/MetricsCarousel";
import { renderWithProviders } from "../../utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupStore } from "../../../store";

const store = setupStore();
const user = userEvent.setup();

describe("MetricsCarousel Component", () => {
  it("should render and handle navigation", async () => {
    renderWithProviders(
      <MetricsCarousel>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </MetricsCarousel>, { store }
    );

    const nextBtn = await screen.findByTestId("metrics-carousel-next-btn");
    const prevBtn = await screen.findByTestId("metrics-carousel-prev-btn");

    const circleBtn3 = await screen.findByTestId(
      "metrics-carousel-circle-btn-2"
    );
    await user.click(nextBtn);
    await waitFor(() => {
      const state = store.getState().upc.forecastOption;
      expect(state).toBe("quantity");
    });

    await user.click(prevBtn);
    await user.click(circleBtn3);

    await waitFor(() => {
      const state = store.getState().upc.forecastOption;
      expect(state).toBe("sales");
    });
  });
});
