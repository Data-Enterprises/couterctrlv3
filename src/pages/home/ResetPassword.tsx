import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setResetPassword } from "../../features/userSlice";
import { resetPassword } from "../../api/security";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

import Modal from "../../components/Modal";
import TextInput from "../../components/TextInput";

const ResetPassword = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const [newPassword, setNewPassword] = useState<string>("");

  const handleChange = (e: string) => {
    setNewPassword(e);
  };

  const handleSubmit = () => {
    resetPassword(context.url, context.token, user.username, newPassword)
      .then(() => {
        dispatch(setResetPassword(0));
        toast.success("Password successfully reset");
      })
      .catch((err: JsonError) => {
        toast.error("Error resetting password:" + err);
      });
  };

  return (
    <Modal isOpen={user.resetPassword === 1} onClose={() => {}}>
      <div className="text-center font-medium text-orange-500 underline">
        Password Reset Detected
      </div>
      <div className="text-center mb-2">Please enter your new password</div>
      <TextInput
        title="New Password"
        name="newPassword"
        query={newPassword}
        setText={handleChange}
        isSimple={true}
        type="password"
      />
      <button className="btn-themeBlue w-full mt-4" onClick={handleSubmit}>
        Change Password
      </button>
    </Modal>
  );
};

export default ResetPassword;
