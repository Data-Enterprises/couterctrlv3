import { roles } from "../..";
import { useAppSelector } from "../../../../hooks";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const UserInfoCard = () => {
  const {
    userInfo,
    userCompanyIds,
    userLevels,
    selectedUserForm,
    selectedUserId,
    users,
  } = useAppSelector((state) => state.users);
  const { companies } = useAppSelector((state) => state.user);
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);

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

  const showCompanies = () => {
    if (selectedUserForm !== "create" && selectedUserId > 0) {
      // In the User Controls, we're just showing the user's companies
      // Company assign/unassign is only valid in creating a user
      // The Companies sub form is where companies can be updated for users after creation
      const user = users.filter((u) => u.id === selectedUserId)[0];
      const companyNames = [...user.companies].map((c) => c.name);
      return companyNames.join(", ");
    }

    const filtered = [...companies].filter((c) =>
      userCompanyIds.includes(c.company),
    );
    const companyNames = filtered.map((c) => c.name);
    if (companyNames.length === 1) {
      return companyNames.join("");
    }
    return companyNames.join(", ");
  };

  return (
    <div
      className={`bg-[rgb(30,45,80)] text-custom-white rounded-lg shadow-lg p-2 flex items-center gap-2`}
    >
      <UserCircleIcon className="" height={140} width={140} fill="white" />
      <div className="">
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
  );
};

export default UserInfoCard;
