import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { setUserFilterText } from "../../../features/usersSlice";
import { setTempPassword } from "../../../api/security";

import PasswordInput from "../../../components/inputs/PasswordInput";
import type { JsonError } from "../../../interfaces";

const UpdatePasswordForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isDesktop } = useAppSelector((state) => state.app);
  const { userInfo, selectedUserId } = useAppSelector((state) => state.users);

  const [pwText, setPwText] = useState<string>("");
  const [confirmText, setConfirmText] = useState<string>("");

  const handlePwChange = (x: string) => {
    setPwText(x);
  };

  const handleConfrimChange = (x: string) => {
    setConfirmText(x);
  };

  const setTempPw = () => {
    setTempPassword(url, token, userInfo.username, pwText)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Temporary password set for " + userInfo.username);
          setPwText("");
          setConfirmText("");
          dispatch(setUserFilterText(""));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const canSubmit = () => {
    return (
      pwText.length > 0 && confirmText.length > 0 && pwText === confirmText
    );
  };

  return (
    <div className={`${isDesktop ? "h-[30vh]" : "p-2"} bg-custom-white mt-4 rounded-lg shadow-lg`}>
      {!selectedUserId ? (
        <div className="h-full flex justify-center items-center">
          <div className="font-medium">
            No user selected. Please select one.
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col gap-4 justify-center items-center">
          <div className="font-medium text-center">
            Set a temporary password for {userInfo.username}
            <div className="font-medium text-center">
              They will be prompted to create a new password on their next login
            </div>
          </div>
          <div className={`flex ${!isDesktop ? "flex-col w-full" : ""} gap-4`}>
            <PasswordInput
              label="Password"
              name="password"
              setText={handlePwChange}
              text={pwText}
              className="w-full"
              leftCompare=""
              rightCompare=""
            />
            <PasswordInput
              label="Confirm Password"
              name="confirm_password"
              setText={handleConfrimChange}
              text={confirmText}
              className="w-full"
              leftCompare=""
              rightCompare=""
            />
          </div>
          <button
            data-testid="update-pw-submit-btn"
            className={`btn-themeGreen w-1/2 ${!canSubmit() && "opacity-50 pointer-events-none"}`}
            onClick={setTempPw}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdatePasswordForm;
