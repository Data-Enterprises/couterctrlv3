import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { roles } from "..";
import { setUserFilterText } from "../../../features/usersSlice";
import { getBGAssignedToUserSplit } from "../../../api/baseGroups";

// import SearchUser from "./SearchUser";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { setAllSelectedBaseGroups } from "../../../features/baseGroupSlice";
import type { JsonError } from "../../../interfaces";

const ProfileCard = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { userInfo, userLevels, selectedUserForm, selectedUserId, users } =
    useAppSelector((state) => state.users);
  const { selectedNewUserStores, selectedBaseGroups } = useAppSelector(
    (state) => state.baseGroup,
  );

  // This is for selecting users in the update/delete forms and showing their info in the profile card
  // The create form is being handled separately in create user as those companies appear in the
  // dropdown showing only what companies the new user can be assigned to based on the creator's companies
  useEffect(() => {
    dispatch(setAllSelectedBaseGroups([]));
    if (selectedUserId) {
      getBGAssignedToUserSplit(url, token, selectedUserId)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setAllSelectedBaseGroups(j.active.flat()));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [selectedUserId]);

  useEffect(() => {
    dispatch(setUserFilterText(""));
  }, [selectedUserForm]);

  const showCompanies = () => {
    if (selectedUserForm !== "create" && selectedUserId > 0) {
      // In the User Controls, we're just showing the user's companies
      // Company assign/unassign is only valid in creating a user
      // The Companies sub form is where companies can be updated for users after creation
      const user = users.filter((u) => u.id === selectedUserId)[0];
      const companyNames = [...user.companies].map((c) => c.name);
      return companyNames.join(", ");
    } else if (selectedUserForm === "create") {
      const filtered = [...companies].filter((c) =>
        selectedNewUserStores.some((s) => s.company === c.company),
      );
      const companyNames = filtered.map((c) => c.name);
      if (companyNames.length === 1) {
        return companyNames.join("");
      }
      return companyNames.join(", ");
    }
    return "";
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
    if (selectedUserForm === "create") {
      if (selectedNewUserStores.length === 0) {
        return "";
      }

      const names = selectedBaseGroups
        .filter((bg) =>
          selectedNewUserStores.some((s) => s.base_group === bg.id),
        )
        .map((b) => b.name)
        .join(", ");
      return names;
    } else {
      if (selectedBaseGroups.length === 0) {
        return "";
      }
      const names = selectedBaseGroups.map((bg) => bg.name).join(", ");
      return names;
    }
  };

  return (
    <div className={`w-full select-none`}>
      <div
        className={`bg-[rgb(30,45,80)] text-custom-white rounded-lg shadow-lg p-2 text-[12.5px] grid grid-cols-[17%_auto] items-center mb-4`}
      >
        <UserCircleIcon className="" height={125} width={125} fill="white" />
        <div className="w-full">
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
          <div className="grid grid-cols-[10.5%_auto]">
            <div className="font-medium">Company:</div>
            <div className="text-nowrap truncate">{showCompanies()}</div>
          </div>
          <div className="grid grid-cols-[13%_auto]">
            <div className="font-medium">Base Groups:</div>
            <div className="text-nowrap truncate">{showBaseGroups()}</div>
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
    </div>
  );
};

export default ProfileCard;
