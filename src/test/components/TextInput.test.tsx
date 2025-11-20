import { describe, it, expect } from "vitest";
import TextInput from "../../components/TextInput";
import { renderWithProviders } from "../utils";
import { setupStore } from "../../store";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "../../interfaces";

const user = userEvent.setup();
const store = setupStore();
const fakeUsers: User[] = [
  {
    id: 1,
    username: "existinguser",
    email: "existinguser@example.com",
    password: "Password123!",
    role: 1,
    active: 1,
    company: 2,
    first_name: "John",
    last_name: "Doe",
    join_date: "2023-01-01",
    last_visit: "2023-06-01",
    logged_in: false,
    password_change_needed: 0,
    security: 2,
    security_answer: "Blue",
    security_question_id: 1,
    template: 0,
    user_level: 2,
  },
];

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
      />
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-red-500");
    expect(pwStrengthBar.classList).toContain("w-1/4");
    expect(pwStrengthBar.classList).toContain("bg-red-500");
    expect(pwStrengthBar.classList).toContain("h-full");
  });

  it("should render Moderate message and yellow strength bar from scoring", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="PassCode!"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-yellow-500");
    expect(pwStrengthBar.classList).toContain("w-1/2");
    expect(pwStrengthBar.classList).toContain("bg-yellow-500");
    expect(pwStrengthBar.classList).toContain("h-full");
  });

  it("should render Strong message and orange strength bar from scoring", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="PassCode!123"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-orange-500");
    expect(pwStrengthBar.classList).toContain("w-3/4");
    expect(pwStrengthBar.classList).toContain("bg-orange-500");
    expect(pwStrengthBar.classList).toContain("h-full");
  });

  it("should render Very Strong message and emerald strength bar from scoring", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query="PassCode!123!@#"
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />
    );

    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");

    expect(msg.classList).toContain("text-emerald-500");
    expect(pwStrengthBar.classList).toContain("w-full");
    expect(pwStrengthBar.classList).toContain("bg-emerald-500");
    expect(pwStrengthBar.classList).toContain("h-full");
  });

  it("should render default width and text color when query is empty", async () => {
    renderWithProviders(
      <TextInput
        title="Password"
        type="password"
        query=""
        name="password"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />
    );
    const pwStrengthBar = screen.getByTestId("pw-strength-bar");
    const msg = screen.getByTestId("text-input-password-message");
    expect(msg.classList).toContain("text-content");
    expect(pwStrengthBar.classList).toContain("w-0");
  });

  it("should render X icon when username matches an existing user's username", async () => {
    const currentStore = setupStore();
    currentStore.dispatch({ type: "users/setUsers", payload: fakeUsers });

    renderWithProviders(
      <TextInput
        title="Username"
        type="text"
        query="existinguser"
        name="username"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store: currentStore }
    );

    const xIcon = screen.getByTestId("x-icon");
    expect(xIcon).toBeInTheDocument();
  });

  it("should not render an icon for username if query is empty", async () => {
    renderWithProviders(
      <TextInput
        title="Username"
        type="text"
        query=""
        name="username"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />
    );

    const msgContainer = screen.getByTestId("text-input-username-message");
    expect(msgContainer).toBeEmptyDOMElement();
  });

  it("should not render an icon if a user is selected", async () => {
    const currentStore = setupStore();
    currentStore.dispatch({ type: "users/setUsers", payload: fakeUsers });
    currentStore.dispatch({ type: "users/setSelectedUserId", payload: 1 });

    renderWithProviders(
      <TextInput
        title="Username"
        type="text"
        query="existinguser"
        name="username"
        setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
      />,
      { store: currentStore }
    );
    const msgContainer = screen.getByTestId("text-input-username-message");
    expect(msgContainer).toBeEmptyDOMElement();
  });

  it("should handle handle matching passwords correctly", async () => {
    renderWithProviders(
      <div>
        <TextInput
          title="Password"
          type="password"
          query="Password123!"
          name="password"
          setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
        />
        <TextInput
          title="Confirm Password"
          type="password"
          query="Password123!"
          name="confirm_password"
          setQuery={(text) => store.dispatch({ type: "noop", payload: text })}
        />
      </div>
    );

    const msg = screen.getByTestId("text-input-confirm_password-message");
    expect(msg.classList).toContain("text-emerald-500");
    expect(msg).toHaveTextContent("Passwords Match");
  });
});
