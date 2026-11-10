// Hooks
import { useRef, useState } from "react";
import { useAppSelector } from "../../../../hooks";

// API
import {
  forgotPWEmailVerify,
  resetForgotPassword,
  validateSecurityAnswer,
} from "../../../../api/password";

// Utils
import { passwordOk } from "../../../../utils/passwordRules";
import {
  ANSWER_EMPTY,
  EMPTY_FORM,
  NETWORK_ERROR,
  PREVIOUS_STEP,
  WHO_EMPTY,
  answerError,
  passwordError,
  whoError,
} from "../utils";

// Interfaces
import type { JsonError } from "../../../../interfaces";
import type { ForgotField, ForgotForm, ForgotReply, ForgotStep } from "../interfaces";

/**
 * The forgot-password flow: the three calls, one step at a time and one
 * request at a time. What was typed lives here, not in Redux: it is a pop-up's
 * working copy, and a typed password has no business in the global store.
 */
export const useForgotFlow = () => {
  const url = useAppSelector((s) => s.app.url);
  const [step, setStep] = useState<ForgotStep>("who");
  const [form, setForm] = useState<ForgotForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A second click lands before React re-renders with `busy`, so the lock is a ref.
  const inFlight = useRef(false);

  const setField = (key: ForgotField) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  };

  const send = async (work: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError((err as JsonError).message || NETWORK_ERROR);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const submitWho = () => {
    const username = form.username.trim();
    const email = form.email.trim();
    if (!username || !email) return setError(WHO_EMPTY);
    return send(async () => {
      const j: ForgotReply = (await forgotPWEmailVerify(url, username, email)).data;
      if (j.error !== 0 || !j.question) return setError(whoError(j.msg));
      setForm((f) => ({ ...f, username, email, question: j.question ?? "" }));
      setStep("question");
    });
  };

  const submitAnswer = () => {
    const answer = form.answer.trim();
    if (!answer) return setError(ANSWER_EMPTY);
    return send(async () => {
      const j: ForgotReply = (await validateSecurityAnswer(url, form.username, answer)).data;
      if (j.error !== 0) return setError(answerError(j.msg));
      setStep("password");
    });
  };

  const submitPassword = () => {
    // The button is disabled until this holds; Enter in a field still lands here.
    if (!passwordOk(form.newPassword) || form.newPassword !== form.confirmPassword) return;
    return send(async () => {
      const j: ForgotReply = (await resetForgotPassword(url, form.username, form.newPassword)).data;
      if (j.error !== 0) return setError(passwordError(j.msg));
      setStep("done");
    });
  };

  const back = () => {
    const previous = PREVIOUS_STEP[step];
    if (!previous || inFlight.current) return;
    setError(null);
    setStep(previous);
  };

  const reset = () => {
    setStep("who");
    setForm(EMPTY_FORM);
    setError(null);
  };

  return { step, form, busy, error, setField, submitWho, submitAnswer, submitPassword, back, reset };
};
