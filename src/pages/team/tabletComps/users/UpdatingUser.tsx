import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { resetUserSecurityQuestion, 
  // updateUser 
} from "../../../../api/team";
// import { setTempPassword } from "../../../../api/security";
import {
  resetUserInfo,
  setSelectedUserId,
  setUserInfo,
} from "../../../../features/usersSlice";
import Input from "../../../../components/inputs/Input";

import {
  KeyIcon,
  UserCircleIcon,
  ArrowLeftCircleIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import type { JsonError } from "../../../../interfaces";
import UserInfoCard from "./UserInfoCard";
import PasswordInput from "../../../../components/inputs/PasswordInput";

interface UpdatingUserFormProps {
  goBack: () => void;
}

const UpdatingUserForm = ({ goBack }: UpdatingUserFormProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [innerForm, setInnerForm] = useState<number>(0);
  // const [isResettingSecurity, setIsResettingSecurity] = useState<boolean>(false);
  const [pw, setPw] = useState<string>("");
  const [confirmPw, setConfirmPw] = useState<string>("");
  const { url, token } = useAppSelector((state) => state.app);
  const ctx = useAppSelector((state) => state.users);

  // const handleTempPW = () => {};
  const handleResetSecurity = () => {
    resetUserSecurityQuestion(url, token, ctx.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Security reset successfully");
        } else {
          toast.error(j.msg);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleGoBack = () => {
    goBack();
    dispatch(resetUserInfo());
    dispatch(setSelectedUserId(0));
  };

  return (
    <div className="grid gap-3">
      {/* Nav */}
      <UserInfoCard />
      <div className="grid grid-cols-4 gap-3">
        <div
          className="flex flex-col items-center justify-center p-4 bg-custom-white rounded-lg shadow-md"
          onClick={handleGoBack}
        >
          <ArrowLeftCircleIcon className="h-10 w-10" />
          <div>Users</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center p-4 ${innerForm === 1 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(1)}
        >
          <UserCircleIcon className="h-10 w-10" />
          <div>Basic Info</div>
        </div>
        <div
          className={`flex flex-col items-center justify-center p-4 ${innerForm === 2 ? "bg-[rgb(30,45,80)]/50 text-custom-white" : "bg-custom-white"} rounded-lg shadow-md`}
          onClick={() => setInnerForm(2)}
        >
          <EyeSlashIcon className="h-10 w-10" />
          <div>Password</div>
        </div>
        <div
          className="flex flex-col items-center justify-center p-4 bg-[rgb(30,45,80)]/95 text-custom-white rounded-lg shadow-md"
          onClick={handleResetSecurity}
        >
          <KeyIcon className="h-10 w-10" />
          <div>Reset Security</div>
        </div>
      </div>

      {/* Forms */}
      {innerForm === 1 ? (
        <div className="grid grid-cols-2 gap-3 p-3 bg-custom-white rounded-xl shadow-lg ">
          <Input
            label="Username"
            value={ctx.userInfo.username}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "username", value: val }))
            }
            className="opacity-75 pointer-events-none"
          />
          <Input
            label="Email"
            value={ctx.userInfo.email}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "email", value: val }))
            }
          />
          <Input
            label="First Name"
            value={ctx.userInfo.first_name}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "first_name", value: val }))
            }
          />
          <Input
            label="Last Name"
            value={ctx.userInfo.last_name}
            setValue={(val) =>
              dispatch(setUserInfo({ key: "last_name", value: val }))
            }
          />
          <div className="col-span-2">
            <button className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow w-full">
              Update {ctx.userInfo.username}
            </button>
          </div>
        </div>
      ) : null}

      {innerForm === 2 ? (
        <div className="flex flex-col justify-center items-center">
          <div className="grid gap-3 w-1/2 bg-custom-white p-3 rounded-xl shadow-lg">
            <div className="text-content/60 text-center">
              Setting a temporary password for {ctx.userInfo.username} will prompt them to change their password on their next login
            </div>
            <PasswordInput
              label="Password"
              name="password"
              setText={(val) => setPw(val)}
              text={pw}
              leftCompare={pw}
              rightCompare={confirmPw}
            />
            <PasswordInput
              label="Confirm Password"
              name="confirm_password"
              setText={(val) => setConfirmPw(val)}
              text={confirmPw}
              leftCompare={pw}
              rightCompare={confirmPw}
            />
            <button className="bg-[rgb(30,45,80)]/95 text-custom-white py-3 px-0 rounded-2xl shadow w-full">
              Set temp password for {ctx.userInfo.username}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UpdatingUserForm;
