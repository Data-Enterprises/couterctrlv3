import { describe, expect, it, vi, type Mock } from "vitest";
import { renderWithProviders } from "../../utils";
import SecurityQuestion from "../../../pages/home/SecurityQuestion";
import { setupStore } from "../../../store";
import { screen, waitFor } from "@testing-library/react";
import {
  getSecurityQuestions,
  setSecurityQuestionAnswer,
} from "../../../api/security";
import {
  defaultSuccessResp,
  JsonErrorResp,
  questionsSuccessResp,
  questionsWarnResp,
} from ".";
import { setSecurityQuestionId } from "../../../features/userSlice";
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();
const store = setupStore();
vi.mock("../../../api/security");

const mockedToastSuccess = vi.fn();
const mockedToastError = vi.fn();
const mockedToastWarning = vi.fn();
const mockedToastInfo = vi.fn();
vi.mock("../../../components/toasts/hooks/useToast", () => ({
  useToast: () => ({
    success: mockedToastSuccess,
    error: mockedToastError,
    warn: mockedToastWarning,
    info: mockedToastInfo,
  }),
}));

describe("SecurityQuestion Component", () => {
  it("should not render if user does not need to set security question", async () => {
    await waitFor(() => {
      store.dispatch(setSecurityQuestionId(1));
      const state = store.getState();
      expect(state.user.securityQuestionId).toBe(1);
    });

    renderWithProviders(<SecurityQuestion />, { store });

    await waitFor(() => {
      store.dispatch(setSecurityQuestionId(0));
      const state = store.getState();
      expect(state.user.securityQuestionId).toBe(0);
    });
  });

  it("should handle api failure when fetching security questions", async () => {
    // handle error
    (getSecurityQuestions as Mock).mockRejectedValueOnce(JsonErrorResp);

    renderWithProviders(<SecurityQuestion />, { store });
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error getting security questions: API request failed"
      );
    });
  });

  it("should throw warning if no security questions are available", async () => {
    // handle success
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsWarnResp);
    renderWithProviders(<SecurityQuestion />, { store });

    // check that modal is rendered
    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith(
        "No security questions available at this time."
      );
    });
  });

  it("should render and fetch security questions successfully", async () => {
    // handle success
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    renderWithProviders(<SecurityQuestion />, { store });

    // check that modal is rendered
    const modal = await screen.findByTestId("modal");
    expect(modal).toBeInTheDocument();

    // Find the single select component and check it's length
    const select = await screen.findByTestId("single-select-0");
    const triggerIcon = await screen.findByTestId(
      "single-select-trigger-icon-0"
    );
    const optionList = await screen.findByTestId("single-select-list-0");

    expect(select).toBeInTheDocument();
    expect(triggerIcon).toBeInTheDocument();
    expect(optionList).toBeInTheDocument();

    // the optionList should have 5 children => 5 questions from the mock response
    const children = optionList.children;
    expect(children.length).toBe(5);
  });

  it("should handle selection of security question and answer submission", async () => {
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    renderWithProviders(<SecurityQuestion />, { store });

    // select 3rd question => favorite food
    const questionInput = await screen.findByTestId("single-select-input-0");

    // This covers query change for singleSelect
    await user.type(questionInput, "test");
    await user.clear(questionInput);

    const question = await screen.findByTestId("single-select-option-0-2");
    const answerInput = await screen.findByTestId("text-input-Answer");

    await user.click(question);
    await user.type(answerInput, "success");
    expect(questionInput).toHaveValue("What is your favorite food?");
    expect(answerInput).toHaveValue("success");
  });

  it("should throw warnings if submission criteria not met", async () => {
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    renderWithProviders(<SecurityQuestion />, { store });

    const questionInput = await screen.findByTestId("single-select-input-0");
    const question = await screen.findByTestId("single-select-option-0-2");
    const answerInput = await screen.findByTestId("text-input-Answer");
    const submitButton = await screen.findByTestId("submit-security-answer");

    // 1. submit with no question and no answer
    await user.click(submitButton);
    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith(
        "Please select a security question and provide an answer."
      );
    });

    // 3. submit with answer but no question
    await user.type(answerInput, "success");
    await user.click(submitButton);
    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith(
        "Please select a security question."
      );
    });
    await user.clear(answerInput);

    // 2. submit with question but no answer
    await user.click(question);
    expect(questionInput).toHaveValue("What is your favorite food?");
    await user.click(submitButton);
    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith(
        "Please provide an answer to the selected security question."
      );
    });
  });

  it("should throw an error if api call to submit question and answer fails", async () => {
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    (setSecurityQuestionAnswer as Mock).mockRejectedValueOnce(JsonErrorResp);
    renderWithProviders(<SecurityQuestion />, { store });

    const question = await screen.findByTestId("single-select-option-0-2");
    const answerInput = await screen.findByTestId("text-input-Answer");
    const submitButton = await screen.findByTestId("submit-security-answer");

    await user.click(question);
    await user.type(answerInput, "success");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith(
        "Error setting security question and answer: API request failed"
      );
    });
  });

  it("should throw warning if api call to submit question and answer fails", async () => {
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    (setSecurityQuestionAnswer as Mock).mockResolvedValueOnce(
      questionsWarnResp
    );
    renderWithProviders(<SecurityQuestion />, { store });

    const question = await screen.findByTestId("single-select-option-0-2");
    const answerInput = await screen.findByTestId("text-input-Answer");
    const submitButton = await screen.findByTestId("submit-security-answer");

    await user.click(question);
    await user.type(answerInput, "success");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedToastWarning).toHaveBeenCalledWith(
        "Failed to set security question and answer."
      );
    });
  });

  it("should successfully submit security question and answer", async () => {
    (getSecurityQuestions as Mock).mockResolvedValueOnce(questionsSuccessResp);
    (setSecurityQuestionAnswer as Mock).mockResolvedValueOnce(
      defaultSuccessResp
    );
    renderWithProviders(<SecurityQuestion />, { store });

    const question = await screen.findByTestId("single-select-option-0-2");
    const answerInput = await screen.findByTestId("text-input-Answer");
    const submitButton = await screen.findByTestId("submit-security-answer");

    await user.click(question);
    await user.type(answerInput, "success");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedToastSuccess).toHaveBeenCalledWith(
        "Security question and answer set successfully."
      );

      const state = store.getState().user;
      expect(state.securityQuestionId).toBe(3);
    });
  });
});
