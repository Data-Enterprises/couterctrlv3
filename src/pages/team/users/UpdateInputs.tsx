import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  resetUserInfo,
  setAvailableEmailDetails,
  setRefresh,
  setUserInfo,
} from "../../../features/usersSlice";
import type { JsonError } from "../../../interfaces";
import { checkEmail, updateUser } from "../../../api/team";
import { roles } from "..";

import Input from "../../../components/inputs/Input";
// import PasswordInput from "../../../components/inputs/PasswordInput";

const UpdateInputs = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const {
    userInfo,
    selectedUserForm,
    // usernameTextColor,
    // availableUsernameText,
    emailTextColor,
    availableEmailText,
    userLevels,
    users,
    selectedUserId,
  } = useAppSelector((state) => state.users);

  const handleUsername = (x: string) => {
    dispatch(setUserInfo({ key: "username", value: x }));
  };

  const handleEmail = (x: string) => {
    dispatch(setUserInfo({ key: "email", value: x }));
  };

  const handleFirstName = (x: string) => {
    dispatch(setUserInfo({ key: "first_name", value: x }));
  };

  const handleLastName = (x: string) => {
    dispatch(setUserInfo({ key: "last_name", value: x }));
  };

  // const handlePassword = (x: string) => {
  //   dispatch(setUserInfo({ key: "password", value: x }));
  // };

  // const handleConfirmPassword = (x: string) => {
  //   dispatch(setUserInfo({ key: "confirm_password", value: x }));
  // };

  const handleEmailValidation = () => {
    if (userInfo.email.length === 0) return;

    const findUser = users.find((u) => u.email === userInfo.email);
    if (
      findUser &&
      findUser.id === selectedUserId &&
      findUser.email === userInfo.email
    ) {
      dispatch(
        setAvailableEmailDetails({
          availableEmailText: "- No Change",
          emailTextColor: "text-content",
        }),
      );
      return;
    }
    checkEmail(url, token, userInfo.email)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(
            setAvailableEmailDetails({
              availableEmailText: "- Available",
              emailTextColor: "text-emerald-600",
            }),
          );
        } else {
          dispatch(
            setAvailableEmailDetails({
              availableEmailText: "- Not Available",
              emailTextColor: "text-red-600",
            }),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleRoleSelect = (val: string) => {
    dispatch(setUserInfo({ key: "role", value: Number(val) }));
  };

  const handleUserLvlSelect = (val: number) => {
    dispatch(setUserInfo({ key: "user_level", value: val }));
  };
  const handleResetSelection = () => {
    dispatch(resetUserInfo());
  };

  const handleUpdateBasicInfo = () => {
    updateUser(url, token, userInfo, 0, 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User updated successfully, refreshing user list...");
          dispatch(setRefresh(true))
        }
      })
      .catch((err: JsonError) => toast.error("Error Updating User: " + err.message));
  };

  return (
    <div className="text-[13.5px]">
      <div className="leading-tight mb-2">
        <div className="font-medium">Basic Information</div>
        <div className="text-content/60 text-[12px]">
          Please ensure all fields are valid
        </div>
      </div>
      {/* User Roles */}
      <div className="text-xs font-medium leading-tight pl-0.5 mb-0.5">
        User Role (select one)
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-2">
        {roles.map((r, i) => (
          <div
            key={i}
            className={`px-2 py-0.5 rounded-full ${userInfo.role === Number(r.value) ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content/85 bg-content/10"} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
            onClick={() => handleRoleSelect(r.value as string)}
          >
            {r.label}
          </div>
        ))}
      </div>

      {/* User Levels */}
      <div className="text-xs font-medium leading-tight pl-0.5 mb-0.5">
        User Level (select one)
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11.5px] leading-tight mb-1">
        {userLevels.map((l, i) => (
          <div
            key={i}
            className={`px-2 py-0.5 rounded-full ${userInfo.user_level === l.id ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content/85 bg-content/10"} cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
            onClick={() => handleUserLvlSelect(l.id)}
          >
            {l.name}
          </div>
        ))}
      </div>

      {/* Basic info inputs */}
      <div className="grid grid-cols-2 gap-x-4">
        <Input
          label="Username"
          value={userInfo.username}
          setValue={handleUsername}
          className={`${selectedUserForm === "update" ? "opacity-50 pointer-events-none" : ""} py-1.5 opacity-50 pointer-events-none`}
        />
        <Input
          label="Email"
          value={userInfo.email}
          setValue={handleEmail}
          validateEmail={handleEmailValidation}
          availableText={availableEmailText}
          textColor={emailTextColor}
        />
        <Input
          label="First Name"
          value={userInfo.first_name}
          setValue={handleFirstName}
        />
        {selectedUserForm === "create" && (
          <Input
            label="Last Name"
            value={userInfo.last_name}
            setValue={handleLastName}
          />
        )}
        {/* {selectedUserForm === "create" && (
          <PasswordInput
            label="Password"
            name="password"
            setText={handlePassword}
            text={userInfo.password}
            className="py-1.5"
            leftCompare={userInfo.password}
            rightCompare={userInfo.confirm_password}
          />
        )} */}
        {selectedUserForm !== "create" && (
          <Input
            label="Last Name"
            value={userInfo.last_name}
            setValue={handleLastName}
          />
        )}
        {/* {selectedUserForm === "create" && (
          <PasswordInput
            label="Confirm Password"
            name="confirm_password"
            setText={handleConfirmPassword}
            text={userInfo.confirm_password}
            className="py-1.5"
            leftCompare={userInfo.password}
            rightCompare={userInfo.confirm_password}
          />
        )} */}
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-sm"
          onClick={handleResetSelection}
        >
          Reset Selection
        </button>
        <button
          className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-sm"
          onClick={handleUpdateBasicInfo}
        >
          Submit Changes
        </button>
      </div>
    </div>
  );
};

export default UpdateInputs;
