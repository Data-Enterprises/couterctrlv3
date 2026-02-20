import { useAppSelector, useAppDispatch } from "../../../hooks";
import { roles } from "..";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";
import { setUserFilterText } from "../../../features/usersSlice";
import SearchUser from "./SearchUser";

const ProfileCard = () => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.user);
  const { userInfo, userCompanyIds, userLevels, selectedUserForm } =
    useAppSelector((state) => state.users);
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    dispatch(setUserFilterText(""));
  }, [selectedUserForm]);

  const showCompanies = () => {
    const filtered = [...companies].filter((c) =>
      userCompanyIds.includes(c.company),
    );
    const companyNames = filtered.map((c) => c.name);
    if (companyNames.length === 1) {
      return companyNames.join("");
    }
    return companyNames.join(", ");
  };

  const showRole = () => {
    const roleName = roles.find((r) => r.value == userInfo.role);
    if (roleName) {
      return roleName.label;
    }
    return "";
  };

  const showUserLvl = () => {
    const lvlName = [...userLevels].find((ul) => ul.id === userInfo.user_level);

    if (lvlName) {
      return lvlName.name;
    }
    return "";
  };

  const showBaseGroups = () => {
    if (selectedBaseGroups.length === 0) {
      return "";
    }
    const names = selectedBaseGroups.map((bg) => bg.name).join(", ");
    return names;
  };

  return (
    <div className="w-full">
      <div
        className={`bg-[rgb(30,45,80)] text-custom-white rounded-lg shadow-lg p-2 text-sm flex gap-2`}
      >
        <UserCircleIcon className="" height={140} width={140} fill="white" />
        <div>
          <div className="flex gap-1">
            <div className="font-medium">Name:</div>
            <div>
              {userInfo.first_name} {userInfo.last_name}
            </div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Email:</div>
            <div>{userInfo.email}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Username:</div>
            <div>{userInfo.username}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Company:</div>
            <div>{showCompanies()}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Base Groups:</div>
            <div>{showBaseGroups()}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Role:</div>
            <div>{showRole()}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Level:</div>
            <div>{showUserLvl()}</div>
          </div>
        </div>
      </div>
      {selectedUserForm !== "create" && selectedUserForm !== "user_info" ? (
        <SearchUser />
      ) : null}
    </div>
  );
};

export default ProfileCard;
