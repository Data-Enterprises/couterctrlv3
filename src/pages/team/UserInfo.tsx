import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setUserInfo,
  setRefresh,
  type UserData,
  resetUserInfo,
  setCompanyModalOpen,
} from "../../features/usersSlice";
import { inputs, roles, userLevels } from ".";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";
import { useTeamErrorCheck } from "./utils";
import { createUser, updateUser } from "../../api/team";
import { useToast } from "../../components/toasts/hooks/useToast";

const UserInfo = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { userInfo, users, selectedUserId } = useAppSelector(
    (state) => state.users,
  );
  const [role, setRole] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const { validateCreateUserInfo } = useTeamErrorCheck();

  useEffect(() => {
    const roleObj = roles.find((r) => r.value == userInfo.role);
    setRole(roleObj ? roleObj.label : "");

    const levelObj = userLevels.find((l) => l.value == userInfo.user_level);
    setLevel(levelObj ? levelObj.label : "");
  }, [userInfo]);

  // For the text fields
  const handleQueryChange = (field: keyof UserData, value: string) => {
    dispatch(setUserInfo({ key: field, value }));
  };

  // For the SingleSelect components
  const handleRoleSelection = (selection: string | number) => {
    const role = Number(selection);
    dispatch(setUserInfo({ key: "role", value: role }));
  };

  const handleLevelSelection = (selection: string | number) => {
    const level = Number(selection);
    dispatch(setUserInfo({ key: "user_level", value: level }));
  };

  const returnOnSelectFunction = (name: string) => {
    if (name === "role") return handleRoleSelection;
    if (name === "user_level") return handleLevelSelection;
  };

  const handleDefaultQuery = (val: string) => {
    if (val === "role") return role;
    if (val === "user_level") return level;
  };

  const handleCreateClick = () => {
    // check required fields
    if (!validateCreateUserInfo()) return;
    // call api to create user
    createUser(context.url, context.token, userInfo)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User created successfully");
          dispatch(resetUserInfo());
          dispatch(setRefresh(true));
        }
      })
      .catch((err) => {
        toast.error("Error creating user " + err.message);
      });
  };

  const handleUpdateClick = () => {
    const found = users.find((u) => u.username === userInfo.username);
    if (!found) return;
    if (!validateCreateUserInfo()) return;
    // call api to update user
    updateUser(
      context.url,
      context.token,
      userInfo,
      found.security || 0,
      found.template || 0,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User updated successfully");
          dispatch(resetUserInfo());
          dispatch(setRefresh(true));
        }
      })
      .catch((err) => {
        toast.error("Error updating user " + err.message);
      });
  };

  const handleReset = () => {
    dispatch(resetUserInfo());
  };

  const isCreatingOrUpdating = (type: "create" | "update") => {
    if (type === "create" && selectedUserId > 0) {
      return "opacity-50 pointer-events-none";
    } else if (type === "update" && selectedUserId === 0) {
      return "opacity-50 pointer-events-none";
    }
    return "";
  };

  const renderSelect = (name: string, i: number) => {
    const ul = inputs.find((input) => input.name === name)!;
    return (
      <SingleSelect
        key={i}
        data={ul.data!}
        valueKey={"value"}
        displayKey={"label"}
        label={ul.title}
        onSelect={returnOnSelectFunction(name)}
        defaultQuery={handleDefaultQuery(name)}
        resetQuery={true}
        className="text-sm"
        innerClass="text-sm"
        id={i}
      />
    );
  };

  const handleCompanyModalOpen = () => {
    dispatch(setCompanyModalOpen(true));
  };

  return (
    <div data-testid="user-info" className="h-full w-full ">
      {/* <div className="flex gap-4 items-center relative">
        <div className="text-lg font-medium underline">
          Personal Information
        </div>
        <div className="text-sm font-medium mt-1">
          **All fields are required
        </div>
      </div> */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        {inputs.map((input, i) => {
          return input.type !== "select" ? (
            <TextInput
              key={i}
              name={input.name}
              query={(userInfo[input.name as keyof UserData] as string) || ""}
              setQuery={(field, value) =>
                handleQueryChange(field as keyof UserData, value)
              }
              title={input.title}
              type={input.type}
            />
          ) : (
            renderSelect(input.name, i)
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-4 select-none w-full pt-2">
        <button
          data-testid="create-user-button"
          className={`btn-themeBlue py-[5px] ${isCreatingOrUpdating("create")}`}
          onClick={handleCreateClick}
        >
          Create
        </button>
        <button
          data-testid="team-update-user-button"
          className={`btn-themeBlue py-[5px] ${isCreatingOrUpdating("update")}`}
          onClick={handleUpdateClick}
        >
          Update
        </button>
        <button
          data-testid="team-update-user-button"
          className={`btn-themeBlue py-[5px] ${isCreatingOrUpdating("update")}`}
          onClick={handleCompanyModalOpen}
        >
          Companies
        </button>
        <button
          data-testid="clear-user-info-btn"
          className="btn-themeBlue py-[5px]"
          onClick={handleReset}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default UserInfo;
