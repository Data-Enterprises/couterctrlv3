import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import PasswordInput from "../../../components/inputs/PasswordInput";
import {
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setUserInfo,
} from "../../../features/usersSlice";
import type { JsonError } from "../../../interfaces";
import { checkEmail, checkUsername } from "../../../api/team";

const UserInputs = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const {
    userInfo,
    selectedUserForm,
    usernameTextColor,
    availableUsernameText,
    emailTextColor,
    availableEmailText,
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

  const handlePassword = (x: string) => {
    dispatch(setUserInfo({ key: "password", value: x }));
  };

  const handleConfirmPassword = (x: string) => {
    dispatch(setUserInfo({ key: "confirm_password", value: x }));
  };

  const handleUsernameValidation = () => {
    checkUsername(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(
            setAvailableUsernameDetails({
              availableUsernameText: "- Available",
              usernameTextColor: "text-emerald-600",
            }),
          );
        } else {
          dispatch(
            setAvailableUsernameDetails({
              availableUsernameText: "- Not Available",
              usernameTextColor: "text-red-600",
            }),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleEmailValidation = () => {
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

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <Input
        label="Username"
        value={userInfo.username}
        setValue={handleUsername}
        className={`${selectedUserForm === "update" ? "opacity-50 pointer-events-none" : ""} py-1.5`}
        validateUsername={handleUsernameValidation}
        availableText={availableUsernameText}
        textColor={usernameTextColor}
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
      {selectedUserForm === "create" && (
        <PasswordInput
          label="Password"
          name="password"
          setText={handlePassword}
          text={userInfo.password}
          className="py-1.5"
          leftCompare={userInfo.password}
          rightCompare={userInfo.confirm_password}
        />
      )}
      {selectedUserForm !== "create" && (
        <Input
          label="Last Name"
          value={userInfo.last_name}
          setValue={handleLastName}
        />
      )}
      {selectedUserForm === "create" && (
        <PasswordInput
          label="Confirm Password"
          name="confirm_password"
          setText={handleConfirmPassword}
          text={userInfo.confirm_password}
          className="py-1.5"
          leftCompare={userInfo.password}
          rightCompare={userInfo.confirm_password}
        />
      )}
    </div>
  );
};

export default UserInputs;
