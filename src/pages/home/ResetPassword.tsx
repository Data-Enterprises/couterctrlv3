import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { setResetPassword } from "../../features/userSlice";
import { resetPassword } from "../../api/security";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

import Modal from "../../components/Modal";
import PasswordInput from "../../components/inputs/PasswordInput";

const ResetPassword = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const [pw, setPw] = useState<string>("");
  const [confirmPw, setConfirmPw] = useState<string>("");
  const [closeModal, setCloseModal] = useState<boolean>(false);

  useEffect(() => {
    if (closeModal) handleClose();
  }, [closeModal]);

  const handleSubmit = () => {
    resetPassword(context.url, context.token, user.username, pw)
      .then(() => {
        setCloseModal(true);
        toast.success("Password successfully reset");
      })
      .catch((err: JsonError) => {
        toast.error("Error resetting password:" + err);
      });
  };

  // Render only if resetPassword is true, otherwise return null to avoid clouding up the DOM
  if (user.resetPassword === 0) {
    return null;
  }

  const handleClose = () => {
    dispatch(setResetPassword(0));
  };

  const canSubmit = () => {
    return pw.length > 0 && confirmPw.length > 0 && pw === confirmPw;
  };

  return (
    <Modal
      isOpen={user.resetPassword === 1}
      onClose={handleClose}
      modalClassName="w-[37%] rounded-2xl bg-white ring-1 ring-black/5 space-y-2.5"
      allowClickOutside={false}
    >
      <div className=" text-center">
        <div className="text-base font-semibold text-slate-900 select-none">
          Password Reset Detected
        </div>
        <div className="text-[13.5px] text-content/60 select-none">
          Please enter your new password and confirm it before submitting.
        </div>
      </div>

      <div className=" grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput
          label="Password"
          name="password"
          setText={(val) => setPw(val)}
          text={pw}
          leftCompare={pw}
          rightCompare={confirmPw}
          className="py-1.5"
        />
        <PasswordInput
          label="Confirm Password"
          name="confirm_password"
          setText={(val) => setConfirmPw(val)}
          text={confirmPw}
          leftCompare={pw}
          rightCompare={confirmPw}
          className="py-1.5"
        />
      </div>

      <button
        data-testid="reset-pw-btn"
        className={`btn-themeBlue w-full py-1.5 ${!canSubmit() ? "pointer-events-none opacity-50" : ""}`}
        onClick={handleSubmit}
      >
        Set New Password
      </button>
    </Modal>
  );
};

export default ResetPassword;
