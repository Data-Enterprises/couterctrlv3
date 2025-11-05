import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import Login from "../pages/home/Login";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./utils";

// And update your test:
describe("Login Page", () => {
  it("should render", () => {
    renderWithProviders(<Login />);
    
  });
  it("should render username and password inputs with empty values", () => {
    renderWithProviders(<Login />);
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    expect(usernameInput.value).toEqual("");
    expect(passwordInput.value).toEqual("");
  });
  it("should handle user interaction in username and password inputs", async () => {
    renderWithProviders(<Login />);
    const usernameInput = screen.getByTestId("username") as HTMLInputElement;
    const passwordInput = screen.getByTestId("password") as HTMLInputElement;

    await userEvent.type(usernameInput, "anotheruser");
    await userEvent.type(passwordInput, "anotherpassword");
    expect(usernameInput.value).toEqual("anotheruser");
    expect(passwordInput.value).toEqual("anotherpassword");
  });
});
