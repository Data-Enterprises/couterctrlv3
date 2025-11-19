import { describe, it, expect } from "vitest";
import TextInput from "../../components/TextInput";
import { renderWithProviders } from "../utils";
import { setupStore } from "../../store";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
const store = setupStore();

describe("TextInput component", () => {
  it("should render with given props", async () => {
    renderWithProviders(
      <TextInput
        title="Username"
        type="text"
        query="testuser"
        name="username"
        isSimple={true}
        setText={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store }
    );
    const textInput = screen.getByTestId("text-input-username");
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveValue("testuser");

    await user.clear(textInput);
  });

  it("should handle complex queries", async () => {
    renderWithProviders(
      <TextInput
        title="Search"
        type="text"
        query="complex search query"
        name="search"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store }
    );
    const textInput = screen.getByTestId("text-input-search");
    expect(textInput).toBeInTheDocument();
    expect(textInput).toHaveValue("complex search query");

    await user.clear(textInput);
  });

  // it should handle encryption toggle
  it("should handle encryption toggle", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="fakepassword123"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store }
    );

    const passwordInput = screen.getByTestId("text-input-password");
    const eyeIcon = screen.getByTestId("eye-icon");
    await user.click(eyeIcon);

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(eyeIcon);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // it should handle query scoring
  it("should render Very Weak message from scoring", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="Pass"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store }
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-content");
    expect(pwStrengthBar.classList).toContain("w-0");
  });

  it("should render Weak message and red strength bar from scoring", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="PassCode"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store }
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-red-500");
    expect(pwStrengthBar.classList).toContain("w-1/4 bg-red-500");
  });

  it("should render Moderate message and yellow strength bar from scoring", async () => {
    
  });
});
