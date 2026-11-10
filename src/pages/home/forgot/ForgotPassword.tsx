// Hooks
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useForgotFlow } from "./hooks";

// Redux
import { setForgotPassword } from "../../../features/appSlice";
import { setUsername } from "../../../features/userSlice";

// Components
import ProgressBars from "./components/ProgressBars";
import WhoStep from "./components/WhoStep";
import QuestionStep from "./components/QuestionStep";
import NewPasswordStep from "./components/NewPasswordStep";
import DoneStep from "./components/DoneStep";

/**
 * Forgot password, over the sign-in page: who you are, your security question,
 * a new password, then back to sign in with your username filled in.
 * Only the current step is on the page, so Tab never reaches a hidden one.
 */
const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.app.showForgotPassword);
  const flow = useForgotFlow();

  // Not mid-request: an answer landing after close would reopen on a later step.
  const close = () => {
    if (flow.busy) return;
    dispatch(setForgotPassword(false));
    flow.reset();
  };

  const signIn = () => {
    dispatch(setUsername(flow.form.username));
    close();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center px-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        data-testid="forgot-password"
        className="relative w-[420px] max-w-full max-h-[calc(100dvh-32px)] overflow-y-auto bg-custom-white rounded-xl shadow-card px-[34px] pt-[30px] pb-[26px] font-body text-portal_navy"
      >
        <button
          type="button"
          onClick={close}
          disabled={flow.busy}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 w-[30px] h-[30px] flex items-center justify-center rounded-md text-brand_slate transition-colors hover:text-portal_navy hover:bg-bkg disabled:cursor-not-allowed cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {flow.step !== "done" && <ProgressBars step={flow.step} />}

        {flow.step === "who" && (
          <WhoStep
            username={flow.form.username}
            email={flow.form.email}
            onUsername={flow.setField("username")}
            onEmail={flow.setField("email")}
            busy={flow.busy}
            error={flow.error}
            onSubmit={flow.submitWho}
            onCancel={close}
          />
        )}
        {flow.step === "question" && (
          <QuestionStep
            question={flow.form.question}
            answer={flow.form.answer}
            onAnswer={flow.setField("answer")}
            busy={flow.busy}
            error={flow.error}
            onSubmit={flow.submitAnswer}
            onBack={flow.back}
          />
        )}
        {flow.step === "password" && (
          <NewPasswordStep
            password={flow.form.newPassword}
            confirm={flow.form.confirmPassword}
            onPassword={flow.setField("newPassword")}
            onConfirm={flow.setField("confirmPassword")}
            busy={flow.busy}
            error={flow.error}
            onSubmit={flow.submitPassword}
            onBack={flow.back}
          />
        )}
        {flow.step === "done" && <DoneStep onSignIn={signIn} />}
      </div>
    </div>
  );
};

export default ForgotPassword;
