import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setEmail,
  setIndex,
  setQuestion,
  setUsername,
} from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import { forgotPWEmailVerify } from "../../../api/password";
import Input from "../../../components/inputs/Input";

const EmailVerify = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);

  const verifyEmailAndUsername = () => {
    forgotPWEmailVerify(context.url, forgot.username, forgot.email)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setQuestion(j.question));
          dispatch(setIndex());
        } else {
          toast.warn("Error processing request");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUserNameChange = (text: string) => {
    dispatch(setUsername(text));
  };

  const handleEmailChange = (text: string) => {
    dispatch(setEmail(text));
  };

  return (
    <div data-testid="email-verify" className="space-y-2">
      <div className="text-center font-medium underline text-sm">Verify Username and Email</div>
      <Input
        label="Username"
        value={forgot.username}
        setValue={handleUserNameChange}
        className="py-1.5"
      />
      <Input
        label="Email"
        value={forgot.email}
        setValue={handleEmailChange}
        className="py-1.5"
      />
      <button
        data-testid="verify-email-button-forgot"
        className="btn-themeBlue w-full"
        onClick={verifyEmailAndUsername}
      >
        Verify
      </button>
    </div>
  );
};

export default EmailVerify;
