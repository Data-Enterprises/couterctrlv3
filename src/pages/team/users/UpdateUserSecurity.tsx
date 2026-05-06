import { useState } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setTempPassword } from "../../../api/security";

import PasswordInput from "../../../components/inputs/PasswordInput";
import { setRefresh } from "../../../features/usersSlice";
import { resetUserSecurityQuestion } from "../../../api/team";

const UpdateUserSecurity = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [pw, setPw] = useState<string>("");
  const [confirmPw, setConfirmPw] = useState<string>("");
  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo, selectedUserId } = useAppSelector((state) => state.users);

  const resetPassword = () => {
    setTempPassword(url, token, userInfo.username, pw)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Temporary password set successfully");
          setPw("");
          setConfirmPw("");
          dispatch(setRefresh(true));
        } else {
          toast.warn("Error setting temporary password: " + j.msg);
        }
      })
      .catch((err) => toast.error("Error setting temp password", err.message));
  };

  const resetSecurity = () => {
    resetUserSecurityQuestion(url, token, selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(
            "User will be prompted to reset security question at next login",
          );
        } else {
          console.log(j)
          toast.warn("Error resetting security question: " + j.msg);
        }
      })
      .catch((err) =>
        toast.error("Error resetting security question", err.message),
      );
  };

  const canResetPW = () => {
    return pw.length > 0 && confirmPw.length > 0 && pw === confirmPw;
  };

  return (
    <div className="text-[13px] space-y-4">
      {/* Instructions */}
      <div className="p-2 bg-content/5 rounded-lg shadow-md border border-content/10">
        <ol className="text-[12px] font-medium text-content/60">
          <li>
            Please ensure the temporary password is confirmed before submitting
          </li>
          <li>
            Reset Security prompts the user to reset their security question
            upon next login
          </li>
        </ol>
      </div>
      {/* Password inputs */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Buttons => Update Password and Reset Security */}
      <div className="grid grid-cols-2 gap-4">
        <button
          className={`${!canResetPW() ? "opacity-50 pointer-events-none" : ""} font-medium transition-all duration-200 bg-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 border border-[rgb(30,45,80)] text-custom-white py-2 px-4 rounded-lg`}
          onClick={resetPassword}
        >
          Reset Password
        </button>
        <button
          className={`font-medium transition-all duration-200 bg-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 border border-[rgb(30,45,80)] text-custom-white py-2 px-4 rounded-lg`}
          onClick={resetSecurity}
        >
          Reset Security
        </button>
      </div>
    </div>
  );
};

export default UpdateUserSecurity;
