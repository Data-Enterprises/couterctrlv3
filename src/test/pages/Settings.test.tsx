import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../utils";
import Settings from "../../pages/settings/Settings";
import { screen } from "@testing-library/react";
import { store } from "../../store";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

describe("Settings page", () => {
  it("should render", () => {
    renderWithProviders(<Settings />);
    const settingsPage = screen.getByTestId("settings-page");
    expect(settingsPage).toBeInTheDocument();
  });

  it("should handle user input changes", async () => {
    renderWithProviders(<Settings />, { store });
    const usernameInput = screen.getByTestId("text-input-username");
    const passwordInput = screen.getByTestId("text-input-password");
    const emailInput = screen.getByTestId("text-input-email");
    const firstNameInput = screen.getByTestId("text-input-firstName");
    const lastNameInput = screen.getByTestId("text-input-lastName");

    await user.type(usernameInput, "NewUsername");
    await user.type(passwordInput, "NewPassword");
    await user.type(emailInput, "newemail@example.com");
    await user.type(firstNameInput, "NewFirstName");
    await user.type(lastNameInput, "NewLastName");

    const icon = screen.getByTestId("single-select-trigger-icon-1");
    await user.click(icon);

    const option = screen.getByTestId("single-select-option-1-2");
    await user.click(option);
  });
});
