import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setEmail,
  setIndex,
  setQuestion,
  setUsername,
} from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import TextInput from "../../../components/TextInput";
import { forgotPWEmailVerify } from "../../../api/password";

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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="h-[250px] px-2">
      <div className="text-center font-medium">Verify Username and Email</div>
      <div className="text-center mb-2">
        Please enter your valid username and email
      </div>
      <TextInput
        query={forgot.username}
        setText={(text) => dispatch(setUsername(text))}
        title="Username"
        isSimple={true}
        name="forgot-username"
      />

      <TextInput
        query={forgot.email}
        setText={(text) => dispatch(setEmail(text))}
        title="Email"
        isSimple={true}
        name="forgot-email"
      />
      <button
        className="btn-themeBlue w-full mt-4"
        onClick={verifyEmailAndUsername}
      >
        Verify
      </button>
    </div>
  );
};

export default EmailVerify;
