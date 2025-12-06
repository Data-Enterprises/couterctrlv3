import { renderWithProviders } from "../utils";
import App from "../../App";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { setupStore } from "../../store";

const store = setupStore();

describe("App Component", () => {
  it("should render without crashing", async () => {
    renderWithProviders(<App />, { store });
    const app = await screen.findByTestId("main-app");
    expect(app).toBeInTheDocument();
  });
});
