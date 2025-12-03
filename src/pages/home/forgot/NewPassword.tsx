import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setNewPassword } from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import TextInput from "../../../components/TextInput";
import { resetForgotPassword } from "../../../api/password";

interface NewPasswordProps {
  onClose: () => void;
}

const NewPassword = ({ onClose }: NewPasswordProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);

  const submitNewPassword = () => {
    if (forgot.newPassword.length === 0 ) {
      toast.warn("Password cannot be empty");
      return;
    }
    
    resetForgotPassword(context.url, forgot.username, forgot.newPassword)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
          onClose();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div data-testid="new-password-forgot" className="h-[177px] px-2">
      <div className="font-medium text-center">Reset Password</div>
      <div className="text-center">
        Once updated, sign in with your new password
      </div>
      <TextInput
        query={forgot.newPassword}
        name="password-new-forgot"
        isSimple={true}
        type="password"
        title="Password"
        setText={(text) => dispatch(setNewPassword(text))}
      />
      <button data-testid="forgot-change-pw-btn" className="btn-themeBlue w-full mt-4" onClick={submitNewPassword}>
        Change Password
      </button>
    </div>
  );
};

export default NewPassword;
