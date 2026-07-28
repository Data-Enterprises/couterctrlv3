import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useDevApi } from "../../hooks/useDevApi";
import { useToast } from "../toasts/hooks/useToast";
import {
  getSecurityQuestions,
  resetPassword,
  setSecurityQuestionAnswer,
} from "../../api/security";
import {
  setResetPassword,
  setSecurityQuestionId,
} from "../../features/userSlice";
import type { JsonError, Question } from "../../interfaces";
import PasswordInput from "../inputs/PasswordInput";
import SingleSelect from "../SingleSelect";
import Input from "../inputs/Input";

type Step = "password" | "security";

const STEP_TITLE: Record<Step, string> = {
  password: "Set a new password",
  security: "Set a security question",
};

const STEP_BLURB: Record<Step, string> = {
  password: "Your account requires a password change before you continue.",
  security:
    "Used to verify it's you if you ever need to reset your password.",
};

// Replaces the separate ResetPassword and SecurityQuestion modals that used to
// both mount in App.tsx. They each self-gated, so a brand new user (password
// change required AND no security question yet) got both stacked on top of
// each other at the same z-index.
const AccountSetupModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  // Pinned to the dev API — these changes have to persist there regardless of
  // which environment the user is currently browsing.
  const { url, token } = useDevApi();
  const appToken = useAppSelector((state) => state.app.token);
  const user = useAppSelector((state) => state.user);

  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionId, setQuestionId] = useState(0);
  const [answer, setAnswer] = useState("");

  // Frozen once, on the first render where the login response has actually
  // landed. Deriving this live would shrink the list mid-flow — finishing the
  // password step dispatches setResetPassword(0), which would renumber the
  // header and drop the user out of the sequence before step 2 renders.
  const planRef = useRef<Step[] | null>(null);
  if (planRef.current === null && appToken) {
    const plan: Step[] = [];
    if (user.resetPassword === 1) plan.push("password");
    if (user.securityQuestionId === 0) plan.push("security");
    if (plan.length > 0) planRef.current = plan;
  }
  const plan = planRef.current;
  const needsSecurity = plan?.includes("security") ?? false;

  useEffect(() => {
    if (!needsSecurity) return;
    getSecurityQuestions(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setQuestions(j.questions);
        else toast.warn("No security questions available at this time.");
      })
      .catch((err: JsonError) =>
        toast.error("Error getting security questions: " + err.message),
      );
  }, [needsSecurity]);

  if (!plan || finished) return null;

  const step = plan[stepIndex];
  const isLastStep = stepIndex === plan.length - 1;

  const advance = () => {
    if (isLastStep) setFinished(true);
    else setStepIndex((i) => i + 1);
  };

  const canSubmitPassword =
    pw.length > 0 && confirmPw.length > 0 && pw === confirmPw;
  const canSubmitSecurity = questionId > 0 && answer.trim().length > 0;
  const canSubmit = step === "password" ? canSubmitPassword : canSubmitSecurity;

  const handlePasswordSubmit = () => {
    setSubmitting(true);
    resetPassword(url, token, user.username, pw)
      .then((resp) => {
        const j = resp.data;
        if (j?.error !== undefined && j.error !== 0) {
          toast.warn(j.msg || "Could not reset password");
          return;
        }
        dispatch(setResetPassword(0));
        toast.success("Password successfully reset");
        advance();
      })
      // The original swallowed this into "[object Object]" by concatenating the
      // error itself — surface the message so a failed dev call is diagnosable.
      .catch((err: JsonError) =>
        toast.error("Error resetting password: " + err.message),
      )
      .finally(() => setSubmitting(false));
  };

  const handleSecuritySubmit = () => {
    setSubmitting(true);
    setSecurityQuestionAnswer(url, token, user.userid, questionId, answer)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSecurityQuestionId(questionId));
          toast.success("Security question and answer set successfully.");
          advance();
        } else {
          toast.warn("Failed to set security question and answer.");
        }
      })
      .catch((err: JsonError) =>
        toast.error(
          "Error setting security question and answer: " + err.message,
        ),
      )
      .finally(() => setSubmitting(false));
  };

  const buttonLabel = () => {
    if (submitting) return "Saving…";
    if (step === "password") return isLastStep ? "Set new password" : "Continue";
    return "Save";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/35"
      style={{ zIndex: 5000 }}
    >
      <div className="bg-custom-white rounded-xl shadow-2xl w-[462px] max-w-[92vw] overflow-hidden">
        <div className="bg-[#1e2a4a] px-4 py-2.5 flex items-center gap-2">
          <span className="text-custom-white text-[13px] font-semibold">
            {plan.length > 1 ? "Finish setting up your account" : STEP_TITLE[step]}
          </span>
          <div className="flex-1" />
          {plan.length > 1 && (
            <span className="text-custom-white/60 text-[11px] flex-shrink-0">
              Step {stepIndex + 1} of {plan.length}
            </span>
          )}
        </div>

        {/* Progress only earns its place when there's more than one step. */}
        {plan.length > 1 && (
          <div className="flex gap-1 px-4 pt-2.5">
            {plan.map((s, i) => (
              <span
                key={s}
                className={`flex-1 h-[3px] rounded-full ${
                  i <= stepIndex ? "bg-[#1e2a4a]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-4">
          {plan.length > 1 && (
            <div className="text-[13px] font-medium text-content mb-1">
              {STEP_TITLE[step]}
            </div>
          )}
          <p className="text-[11.5px] text-content/70 leading-relaxed mb-3">
            {STEP_BLURB[step]}
          </p>

          {step === "password" ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <PasswordInput
                label="New password"
                name="password"
                text={pw}
                setText={setPw}
                leftCompare={pw}
                rightCompare={confirmPw}
                className="py-1.5"
              />
              <PasswordInput
                label="Confirm password"
                name="confirm_password"
                text={confirmPw}
                setText={setConfirmPw}
                leftCompare={pw}
                rightCompare={confirmPw}
                className="py-1.5"
              />
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              <SingleSelect
                label="Question"
                data={questions}
                valueKey="id"
                displayKey="question"
                onSelect={(id) => setQuestionId(id as number)}
                defaultQuery={
                  questionId > 0
                    ? questions.find((q) => q.id === questionId)?.question
                    : ""
                }
                canType={false}
                innerClass="py-1.5"
              />
              <Input
                label="Answer"
                value={answer}
                setValue={setAnswer}
                className="py-1.5"
              />
            </div>
          )}

          <button
            data-testid={
              step === "password" ? "reset-pw-btn" : "submit-security-answer"
            }
            onClick={
              step === "password" ? handlePasswordSubmit : handleSecuritySubmit
            }
            disabled={!canSubmit || submitting}
            className={`w-full text-[12px] font-medium py-2 rounded-md text-custom-white transition-colors ${
              canSubmit && !submitting
                ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {buttonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSetupModal;
