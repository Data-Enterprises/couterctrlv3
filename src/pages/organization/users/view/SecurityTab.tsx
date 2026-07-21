import { useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { setTempPassword } from "../../../../api/security";
import { resetUserSecurityQuestion } from "../../../../api/team";
import { setRefresh } from "../../../../features/usersSlice";
import type { JsonError, User } from "../../../../interfaces";
import PasswordInput from "../../../../components/inputs/PasswordInput";

interface SecurityTabProps {
  user: User;
}

// Takes the target user as a prop rather than reading ctx.selectedUserId/
// ctx.userInfo — this is opened directly from the Users grid row action now,
// not from within the edit-user detail view, so there's no "currently
// selected for editing" state to piggyback on.
const SecurityTab = ({ user }: SecurityTabProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const canResetPW = pw.length > 0 && confirmPw.length > 0 && pw === confirmPw;

  const resetPassword = () => {
    setTempPassword(ctx.url, ctx.token, user.username, pw)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Temporary password set successfully");
          setPw("");
          setConfirmPw("");
          ctx.dispatch(setRefresh(true));
        } else {
          toast.warn("Error setting temporary password: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error setting temp password: " + err.message),
      );
  };

  const resetSecurity = () => {
    resetUserSecurityQuestion(ctx.url, ctx.token, user.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(
            "User will be prompted to reset security question at next login",
          );
        } else {
          toast.warn("Error resetting security question: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error resetting security question: " + err.message),
      );
  };

  return (
    <div className="max-w-[440px]">
      <div className="p-2.5 bg-gray-50 rounded-lg">
        <ul className="text-[11px] text-content/70 list-disc pl-4 space-y-0.5">
          <li>The temporary password must be confirmed before submitting</li>
          <li>
            Reset security prompts the user to reset their security question
            upon next login
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <PasswordInput
          label="Password"
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

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={resetPassword}
          disabled={!canResetPW}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${canResetPW ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"}`}
        >
          Reset password
        </button>
        <button
          onClick={resetSecurity}
          className="text-[12px] font-medium px-4 py-1.5 rounded-md bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 text-custom-white"
        >
          Reset security
        </button>
      </div>
    </div>
  );
};

export default SecurityTab;
