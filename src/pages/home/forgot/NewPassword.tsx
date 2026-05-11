import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setConfirmNewPassword,
  setNewPassword,
} from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import { resetForgotPassword } from "../../../api/password";
import PasswordInput from "../../../components/inputs/PasswordInput";

interface NewPasswordProps {
  onClose: () => void;
}

const NewPassword = ({ onClose }: NewPasswordProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);

  const submitNewPassword = () => {
    if (forgot.newPassword.length === 0) {
      toast.warn("Password cannot be empty");
      return;
    }

    resetForgotPassword(context.url, forgot.username, forgot.newPassword)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
          onClose();
        } else {
          toast.warn("Error processing request");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handlePwChange = (text: string) => {
    dispatch(setNewPassword(text));
  };

  const handleConfirmPwChange = (text: string) => {
    dispatch(setConfirmNewPassword(text));
  };

  const canSubmit = () => {
    return (
      forgot.newPassword.length > 0 &&
      forgot.confirmNewPassword.length > 0 &&
      forgot.newPassword === forgot.confirmNewPassword
    );
  };

  return (
    <div data-testid="new-password-forgot" className="">
      <div className="font-medium text-center underline">
        Enter New Password
      </div>
      <div className="text-center text-[13px] text-content/60 mb-2">
        Please enter a new password and confirm it before submitting
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PasswordInput
          label="Password"
          name="password"
          text={forgot.newPassword}
          setText={handlePwChange}
          className="py-1.5"
          leftCompare={forgot.newPassword}
          rightCompare={forgot.confirmNewPassword}
        />
        <PasswordInput
          label="Confirm Password"
          name="confirm_password"
          text={forgot.confirmNewPassword}
          setText={handleConfirmPwChange}
          className="py-1.5"
          leftCompare={forgot.newPassword}
          rightCompare={forgot.confirmNewPassword}
        />
      </div>
      <button
        data-testid="forgot-change-pw-btn"
        className={`${!canSubmit() ? "opacity-50 pointer-events-none" : ""} btn-themeBlue w-full py-1.5 mt-2.5`}
        onClick={submitNewPassword}
      >
        Change Password
      </button>
    </div>
  );
};

export default NewPassword;
