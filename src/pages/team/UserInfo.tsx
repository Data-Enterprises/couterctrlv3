import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setUserInfo,
  setIsCreating,
  setIsUpdating,
  type UserData,
} from "../../features/usersSlice";
import { inputs, roles, userLevels, sampleCompanies } from ".";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";

const UserInfo = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.users.userInfo);
  const [role, setRole] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [company, setCompany] = useState<string>("");

  useEffect(() => {
    const roleObj = roles.find((r) => r.value == userInfo.role);
    setRole(roleObj ? roleObj.label : "");

    const levelObj = userLevels.find((l) => l.value == userInfo.user_level);
    setLevel(levelObj ? levelObj.label : "");

    const companyObj = sampleCompanies.find((c) => c.value == userInfo.company);
    setCompany(companyObj ? companyObj.label : "");
  }, [userInfo]);

  useEffect(() => {
    return () => {
      dispatch(setIsCreating(false));
      dispatch(setIsUpdating(false));
    };
  }, []);

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

  const handleCompanySelection = (selection: string | number) => {
    const company = Number(selection);
    dispatch(setUserInfo({ key: "company", value: company }));
  };

  const returnOnSelectFunction = (name: string) => {
    if (!name) return () => {};
    if (name === "role") return handleRoleSelection;
    if (name === "user_level") return handleLevelSelection;
    if (name === "company") return handleCompanySelection;
  };

  const handleDefaultQuery = (val: string) => {
    if (val === "role") return role;
    if (val === "user_level") return level;
    if (val === "company") return company;
  };

  const handleCreateClick = () => {
    // dispatch(setIsCreating(true));
  };

  const handleUpdateClick = () => {
    // dispatch(setIsUpdating(true));
  };

  return (
    <div className="h-full w-full ">
      <div className="text-lg font-medium underline">Personal Information</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        {inputs.map((input, i) => {
          return input.type !== "select" ? (
            <TextInput
              key={i}
              name={input.name}
              query={userInfo[input.name as keyof UserData] as string}
              setQuery={(field, value) =>
                handleQueryChange(field as keyof UserData, value)
              }
              title={input.title}
              type={input.type}
            />
          ) : (
            <SingleSelect
              key={i}
              data={input.data!}
              valueKey={"value"}
              displayKey={"label"}
              label={input.title}
              onSelect={returnOnSelectFunction(input.name)}
              defaultQuery={handleDefaultQuery(input.name)}
              resetQuery={true}
              className="text-sm"
              innerClass="text-sm"
            />
          );
        })}
        <div className="flex justify-between items-end gap-4">
          <div className="w-1/2">
            <button
              className="btn-themeBlue py-[5px] w-full"
              onClick={handleCreateClick}
            >
              Create User
            </button>
          </div>
          <div className="w-1/2">
            <button
              className="btn-themeBlue py-[5px] w-full"
              onClick={handleUpdateClick}
            >
              Update User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
