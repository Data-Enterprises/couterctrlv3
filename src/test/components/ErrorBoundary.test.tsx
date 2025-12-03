import { expect, it, describe, vi } from "vitest";
import { renderWithProviders } from "../utils";
import ErrorBoundary from "../../components/ErrorBoundary";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

describe("ErrorBoundary", () => {
  it("renders fallback UI when an error is thrown", () => {
    const ProblemChild = () => {
      throw new Error("Test error");
    };
    renderWithProviders(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

it("should reload the page when reset button is clicked", async () => {
  const ProblemChild = () => {
    throw new Error("Test error");
  };

  // Store original and mock window.location BEFORE rendering
  const originalLocation = window.location;
  Object.defineProperty(window, "location", {
    value: {
      reload: vi.fn(),
    },
    writable: true,
  });

  renderWithProviders(
    <ErrorBoundary>
      <ProblemChild />
    </ErrorBoundary>
  );

  const resetButton = screen.getByTestId("error-boundary-reset-button");
  await user.click(resetButton);

  expect(window.location.reload).toHaveBeenCalled();

  // Restore original location
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
  });
});

});
