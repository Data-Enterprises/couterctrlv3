import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { roles } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  setAvailableEmailDetails,
  setAvailableUsernameDetails,
  setUserCompanyIds,
  setUserInfo,
} from "../../../features/usersSlice";
import { getBaseGroups } from "../../../api/baseGroups";
import {
  resetSelectedBaseGroups,
  setBaseGroups,
  // setBgsToAssign,
  // setBgsToUnassign,
  setCompany,
  setSelectedBaseGroups,
} from "../../../features/baseGroupSlice";

import type { CompanyBaseGroup, JsonError } from "../../../interfaces";

// Components/Icons
import { InfoIcon } from "../../../components/toasts/Icons";
import SingleSelect from "../../../components/SingleSelect";
import UserFormButtons from "./UserFormButtons";
import PasswordInput from "../../../components/inputs/PasswordInput";
import Input from "../../../components/inputs/Input";
import DeleteUserForm from "./DeleteUserForm";
import UpdatePasswordForm from "./UpdatePasswordForm";
import UserInfo from "./UserInfo";
import ResetSecurityForm from "./ResetSecurity";
import { checkEmail, checkUsername } from "../../../api/team";

const UserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const {
    userLevels,
    userInfo,
    selectedUserForm,
    userCompanyIds,
    selectedUserId,
    isDeletingUser,
    usernameTextColor,
    availableUsernameText,
    emailTextColor,
    availableEmailText,
  } = useAppSelector((state) => state.users);
  const { baseGroups, selectedBaseGroups } = useAppSelector(
    (state) => state.baseGroup,
  );
  const user = useAppSelector((state) => state.user);
  const [defaultCompanyQuery, setDefaultCompanyQuery] = useState<string>("");

  useEffect(() => {
    const companyString = () => {
      if (selectedUserId) {
        const filtered = [...user.companies].filter((c) =>
          userCompanyIds.includes(c.company),
        );

        const companyNames = filtered.map((c) => c.name);
        if (companyNames.length) {
          return companyNames[0];
        }
      }
      return "";
    };
    setDefaultCompanyQuery(companyString());
  }, [selectedUserId]);

  useEffect(() => {
    const selected = [...selectedBaseGroups];
    const newCompanyIds = selected.reduce(
      (acc: number[], curr: CompanyBaseGroup) => {
        if (!acc.includes(curr.company)) {
          acc.push(curr.company);
        }
        return acc;
      },
      [],
    );

    dispatch(setUserCompanyIds(newCompanyIds));
  }, [selectedBaseGroups]);

  useEffect(() => {
    if (selectedUserId === 0) {
      dispatch(resetSelectedBaseGroups());
    }
  }, [selectedUserId]);

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

  const handleUserLvlSelect = (x: string | number) => {
    dispatch(setUserInfo({ key: "user_level", value: Number(x) }));
  };

  const handleRoleSelect = (x: string | number) => {
    dispatch(setUserInfo({ key: "role", value: Number(x) }));
  };

  const findRole = () => {
    const role = userInfo.role;
    const found = roles.find((r) => r.value == role);
    if (found) {
      return found.label;
    }
    return "";
  };

  const findUserLvl = () => {
    const ul = userInfo.user_level;
    const found = userLevels.find((x) => x.id === ul);
    if (found) {
      return found.name;
    }
    return "";
  };

  const handleCompanySelect = (x: string | number) => {
    getBaseGroups(url, token, Number(x))
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBaseGroups(j.groups));
          dispatch(setCompany(j.company[0]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleBaseGroupSelect = (x: string | number) => {
    const id = Number(x);
    const bg = [...baseGroups].filter((g) => g.id === id);
    dispatch(setSelectedBaseGroups(bg[0]));
  };

  // if deleting a user or setting a temp password, check these components
  if (isDeletingUser) return <DeleteUserForm />;
  if (selectedUserForm === "update_password") return <UpdatePasswordForm />;
  if (selectedUserForm === "user_info") return <UserInfo />;
  if (selectedUserForm === "reset_security") return <ResetSecurityForm />;

  const handleUsernameValidation = () => {
    if (userInfo.username.length === 0) {
      dispatch(
        setAvailableUsernameDetails({
          availableUsernameText: "",
          usernameTextColor: "",
        }),
      );
      return;
    }
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
    if (userInfo.email.length === 0) {
      dispatch(
        setAvailableEmailDetails({
          availableEmailText: "",
          emailTextColor: "",
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

  // Otherwise, we're either creating a new user or updating an existing one
  return (
    <div className="bg-custom-white rounded-lg shadow-lg mt-4 p-4 space-y-2">
      <div className="flex items-center gap-2 select-none">
        <InfoIcon fill="#3b82f6" width={17} height={17} />
        <div className="text-sm font-medium text-content/70">
          Ensure all fields are valid before submitting
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`${selectedUserForm === "delete" ? "opacity-50 pointer-events-none" : ""}`}
        >
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
        </div>
        <div
          className={`${selectedUserForm === "delete" ? "opacity-50 pointer-events-none" : ""}`}
        >
          <SingleSelect
            id={1}
            label="User Level"
            data={userLevels.filter((ul) => ul.id <= user.userLevel)}
            displayKey={"name"}
            valueKey="id"
            className="text-sm"
            innerClass="text-sm"
            onSelect={handleUserLvlSelect}
            resetQuery={true}
            defaultQuery={findUserLvl()}
          />
          <SingleSelect
            id={2}
            data={roles}
            valueKey={"value"}
            displayKey={"label"}
            label={"Role"}
            className="text-sm"
            innerClass="text-sm"
            onSelect={handleRoleSelect}
            resetQuery={true}
            defaultQuery={findRole()}
          />
          {selectedUserForm === "create" && (
            <SingleSelect
              id={3}
              data={user.companies}
              valueKey={"company"}
              displayKey={"name"}
              label={"Company"}
              className="text-sm"
              innerClass="text-sm"
              onSelect={handleCompanySelect}
              resetQuery={true}
              defaultQuery={defaultCompanyQuery}
            />
          )}
          {selectedUserForm === "create" && (
            <SingleSelect
              id={4}
              data={baseGroups}
              valueKey={"id"}
              displayKey={"name"}
              label={"Base Group"}
              className="text-sm"
              innerClass="text-sm"
              onSelect={handleBaseGroupSelect}
              resetQuery={true}
              defaultQuery={
                baseGroups.length === 0 ? "Select company first" : ""
              }
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
      </div>
      <UserFormButtons formType={selectedUserForm} />
    </div>
  );
};

export default UserForm;
