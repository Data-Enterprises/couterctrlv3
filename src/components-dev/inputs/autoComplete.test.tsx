import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Input from "./Input";
import PasswordInput from "./PasswordInput";

/**
 * The Add user form must not be filled with the signed-in admin's own login.
 *
 * The dev review found Chrome putting the admin's username and saved password
 * into a new user's fields, because neither input passed `autoComplete`
 * through, so the browser read the form as a sign-in. An admin who did not
 * notice would create a user with their own password.
 */
describe("dev inputs", () => {
  it("passes autoComplete to the text input", () => {
    render(
      <Input value="" setValue={() => {}} label="Username" autoComplete="off" />,
    );
    expect(screen.getByTestId("input-username")).toHaveAttribute(
      "autocomplete",
      "off",
    );
  });

  it("passes autoComplete to the password input", () => {
    render(
      <PasswordInput
        label="Password"
        name="password"
        text=""
        setText={() => {}}
        autoComplete="new-password"
      />,
    );
    expect(screen.getByTestId("text-input-password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("leaves the attribute off when the caller says nothing", () => {
    // Search boxes and filters keep the browser's own behaviour.
    render(<Input value="" setValue={() => {}} label="Search" />);
    expect(screen.getByTestId("input-search")).not.toHaveAttribute(
      "autocomplete",
    );
  });
});
