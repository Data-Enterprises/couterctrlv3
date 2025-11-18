import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../utils";
import userEvent from "@testing-library/user-event";
import { store } from "../../../store";
import UserInfo from "../../../pages/team/UserInfo";
// import axios from "axios";

// Mock axios for API calls by using vi.mock to mock the entire module
// vi.mock("axios");
// const mockedAxios = axios as Mocked<typeof axios>;
const user = userEvent.setup();

describe("UserInfo component", () => {
  it("should render", () => {
    renderWithProviders(<UserInfo />);
    const userInfo = screen.getByTestId("user-info");
    expect(userInfo).toBeInTheDocument();
  });

  it("should handle changes on input text change", async () => {
    renderWithProviders(<UserInfo />);

    // grab the inputs
    const username = screen.getByTestId("text-input-username");
    const email = screen.getByTestId("text-input-email");
    const firstName = screen.getByTestId("text-input-first_name");
    const lastName = screen.getByTestId("text-input-last_name");

    // simulate user typing
    await user.type(username, "omgNewUserNoWay");
    await user.type(email, "123@example.com");
    await user.type(firstName, "First");
    await user.type(lastName, "Last");

    // check the state
    const state = store.getState().users.userInfo;
    expect(state.username).toBe("omgNewUserNoWay");
    expect(state.email).toBe("123@example.com");
    expect(state.first_name).toBe("First");
    expect(state.last_name).toBe("Last");
  });

  it("should handle changes on SingleSelect change", async () => {
    renderWithProviders(<UserInfo />);

    // grab the selects
    const roleSelect = screen.getByTestId("single-select-4");
    const roleSelectIcon = within(roleSelect).getByTestId(
      "single-select-trigger-icon-4"
    );
    const levelSelect = screen.getByTestId("single-select-5");
    const levelSelectIcon = within(levelSelect).getByTestId(
      "single-select-trigger-icon-5"
    );
    const companySelect = screen.getByTestId("single-select-8");
    const companySelectIcon = within(companySelect).getByTestId(
      "single-select-trigger-icon-8"
    );

    // simulate user selecting options
    await user.click(roleSelectIcon);
    const roleOption = screen.getByTestId("single-select-option-4-3");
    await user.click(roleOption);

    await user.click(levelSelectIcon);
    const levelOption = screen.getByTestId("single-select-option-5-8");
    await user.click(levelOption);

    await user.click(companySelectIcon);
    const companyOption = screen.getByTestId("single-select-option-8-2");
    await user.click(companyOption);

    // check the state => storing the id values in redux
    const state = store.getState().users.userInfo;
    expect(state.role).toBe(3);
    expect(state.user_level).toBe(4);
    expect(state.company).toBe(1);
  });

  it("should handle non-matching password and confirm password", async () => {
    renderWithProviders(<UserInfo />);

    const password = screen.getByTestId("text-input-password");
    const confirmPassword = screen.getByTestId("text-input-confirm_password");

    // handle user typing event
    await user.type(password, "Password3!");
    await user.type(confirmPassword, "Password@");

    // check the state, in this test passwords should not be matching
    const state = store.getState().users.userInfo;
    expect(state.password).not.toBe(state.confirm_password);

    // check the confirm password message
    await waitFor(() => {
      const confirmPasswordMessage = screen.getByTestId(
        "text-input-confirm_password-message"
      );
      expect(confirmPasswordMessage).toHaveClass("text-orange-500");
      expect(confirmPasswordMessage).toHaveTextContent(
        "Passwords do not match"
      );
    });

    // clear inputs
    await user.clear(password);
    await user.clear(confirmPassword);
  });

  it("should handle changes for matching password and confirm password", async () => {
    renderWithProviders(<UserInfo />);

    const password = screen.getByTestId("text-input-password");
    const confirmPassword = screen.getByTestId("text-input-confirm_password");

    // handle user typing event
    await user.type(password, "Password123!");
    await user.type(confirmPassword, "Password123!");

    // check the state, in this test passwords should be matching
    const state = store.getState().users.userInfo;
    expect(state.password).toBe(state.confirm_password);

    // check the confirm password message
    await waitFor(() => {
      const confirmPasswordMessage = screen.getByTestId(
        "text-input-confirm_password-message"
      );
      expect(confirmPasswordMessage).toHaveClass("text-emerald-500");
      expect(confirmPasswordMessage).toHaveTextContent("Passwords Match");
    });
  });

  // it("should handle the successful creating of a user", async () => {
  //   renderWithProviders(<UserInfo />);

  //   const createUserBtn = screen.getByTestId("create-user-button");
  //   console.log(createUserBtn.className)
  //   mockedAxios.post.mockResolvedValue({
  //     data: { error: 0, msg: "New user created!" },
  //   });

  //   await user.click(createUserBtn);
  //   // expect(mockedAxios).toHaveBeenCalled();

  //   store.dispatch({ type: "users/resetUserInfo" });
  // });

  // it("should handle the failed creating of a user", async () => {
  //   renderWithProviders(<UserInfo />);

  //   const createUserBtn = screen.getByTestId("create-user-button");
  //   mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

  //   await user.click(createUserBtn);

  //   await waitFor(() => {
  //     expect(mockedAxios).toHaveBeenCalled();
  //   });
  // });
});
