// Hooks
import { useAccountSetup } from "./hooks";

// Utils
import { STEP_BLURB, STEP_TITLE } from "./utils";

// Components
import SetupHeader from "./components/SetupHeader";
import PasswordStep from "./components/PasswordStep";
import SecurityStep from "./components/SecurityStep";
import SignOutRow from "./components/SignOutRow";

/**
 * After sign-in, what an account still has to set: a new password, a first
 * security question, or both, as one modal of one or two steps. It can't be
 * closed, so Sign out is the way out.
 */
const AccountSetupModal = () => {
  const setup = useAccountSetup();
  if (!setup.open) return null;

  const several = setup.plan.length > 1;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-setup-title"
        className="bg-custom-white rounded-xl shadow-card w-[462px] max-w-full overflow-hidden"
      >
        <SetupHeader
          title={several ? "Finish setting up your account" : STEP_TITLE[setup.step]}
          stepIndex={setup.stepIndex}
          total={setup.plan.length}
        />
        <form
          noValidate
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setup.submit();
          }}
        >
          {several && (
            <div className="text-[14px] font-semibold text-content mb-1">{STEP_TITLE[setup.step]}</div>
          )}
          <p className="text-[12.5px] text-content leading-relaxed mb-3">{STEP_BLURB[setup.step]}</p>

          {setup.step === "password" ? (
            <PasswordStep
              pw={setup.pw}
              confirmPw={setup.confirmPw}
              onPw={setup.setPw}
              onConfirmPw={setup.setConfirmPw}
            />
          ) : (
            <SecurityStep
              questions={setup.questions}
              failed={setup.questionsFailed}
              questionId={setup.questionId}
              onQuestion={setup.setQuestionId}
              answer={setup.answer}
              onAnswer={setup.setAnswer}
            />
          )}

          <button
            type="submit"
            data-testid={setup.step === "password" ? "reset-pw-btn" : "submit-security-answer"}
            disabled={!setup.canSubmit || setup.submitting}
            className="w-full text-[12.5px] font-semibold py-2 rounded-md text-custom-white bg-brand_navy transition-colors hover:bg-brand_navy_hover disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {setup.buttonLabel}
          </button>
          <SignOutRow username={setup.username} onSignOut={setup.signOut} />
        </form>
      </div>
    </div>
  );
};

export default AccountSetupModal;
