// Hooks
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../toasts/hooks/useToast";

// Redux
import { resetAppSlice } from "../../../features/appSlice";
import { setResetPassword, setSecurityQuestionId } from "../../../features/userSlice";

// API
import { getSecurityQuestions, resetPassword, setSecurityQuestionAnswer } from "../../../api/security";

// Utils
import { passwordOk } from "../../../utils/passwordRules";
import { impersonatedBy } from "../../../utils/session";

// Interfaces
import type { JsonError, Question } from "../../../interfaces";
import type { SetupStep } from "../interfaces";

/**
 * The account setup steps, their calls and the way out.
 *
 * Reads the environment the person is signed in to (one RDS either way), and
 * never opens for an impersonated session: a password and security answer are
 * the person's own to choose.
 */
export const useAccountSetup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { url, token } = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);

  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsFailed, setQuestionsFailed] = useState(false);
  const [questionId, setQuestionId] = useState(0);
  const [answer, setAnswer] = useState("");

  // Frozen on the first render with a token: finishing the password step
  // clears resetPassword, which would otherwise drop step 2 mid-flow.
  const planRef = useRef<SetupStep[] | null>(null);
  if (planRef.current === null && token && !impersonatedBy(token)) {
    const plan: SetupStep[] = [];
    if (user.resetPassword === 1) plan.push("password");
    if (user.securityQuestionId === 0) plan.push("security");
    if (plan.length > 0) planRef.current = plan;
  }
  const plan = planRef.current;
  const needsSecurity = plan?.includes("security") ?? false;

  useEffect(() => {
    if (!needsSecurity || !token) return;
    getSecurityQuestions(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setQuestions(j.questions);
        else setQuestionsFailed(true);
      })
      .catch((err: JsonError) => {
        setQuestionsFailed(true);
        toast.error("Error getting security questions: " + err.message);
      });
  }, [needsSecurity, token, url]);

  const step = plan?.[stepIndex] ?? "password";
  const isLastStep = plan ? stepIndex === plan.length - 1 : true;

  const canSubmit =
    step === "password"
      ? passwordOk(pw) && pw === confirmPw
      : questionId > 0 && answer.trim().length > 0;

  const advance = () => {
    if (isLastStep) setFinished(true);
    else setStepIndex((i) => i + 1);
  };

  const submitPassword = () => {
    setSubmitting(true);
    resetPassword(url, token, user.username, pw)
      .then((resp) => {
        const j = resp.data;
        if (j?.error !== undefined && j.error !== 0) {
          toast.warn(j.msg || "Could not reset password");
          return;
        }
        dispatch(setResetPassword(0));
        toast.success("Password changed");
        advance();
      })
      .catch((err: JsonError) => toast.error("Error resetting password: " + err.message))
      .finally(() => setSubmitting(false));
  };

  // Saved trimmed: the reset flow compares answers without trimming them.
  const submitSecurity = () => {
    setSubmitting(true);
    setSecurityQuestionAnswer(url, token, user.userid, questionId, answer.trim())
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSecurityQuestionId(questionId));
          toast.success("Security question saved");
          advance();
        } else {
          toast.warn("Failed to set security question and answer.");
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error setting security question and answer: " + err.message),
      )
      .finally(() => setSubmitting(false));
  };

  const submit = () => {
    if (!canSubmit || submitting) return;
    if (step === "password") submitPassword();
    else submitSecurity();
  };

  // The same way out as the title bar's Sign out.
  const signOut = () => {
    navigate("/");
    dispatch(resetAppSlice());
  };

  const buttonLabel = submitting
    ? "Saving…"
    : step === "password"
      ? isLastStep
        ? "Set new password"
        : "Continue"
      : "Save";

  return {
    open: plan !== null && !finished,
    plan: plan ?? [],
    step,
    stepIndex,
    username: user.username,
    pw,
    setPw,
    confirmPw,
    setConfirmPw,
    questions,
    questionsFailed,
    questionId,
    setQuestionId,
    answer,
    setAnswer,
    canSubmit,
    submitting,
    submit,
    buttonLabel,
    signOut,
  };
};
