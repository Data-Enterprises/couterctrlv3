import { useAppSelector, useAppDispatch } from "../../../hooks";
import { roles } from "..";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Input from "../../../components/inputs/Input";
import type {
  BaseGroup,
  BaseGroupJsonResp,
  CompanyBaseGroup,
  JsonError,
  User,
} from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setAssignBaseGroups,
  setSelectedUserId,
  setSelectedUserInfo,
} from "../../../features/usersSlice";
import {
  setSelectedQsUserEmail,
  setValidUser,
} from "../../../features/qsSlice";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import { setAllSelectedBaseGroups } from "../../../features/baseGroupSlice";

const ProfileCard = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const qs = useAppSelector((state) => state.quicksight);
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const [text, setText] = useState<string>("");
  const [filterType, setFilterType] = useState<"name" | "email">("name");
  const {
    userInfo,
    userCompanyIds,
    userLevels,
    selectedUserForm,
    users,
    selectedCompanyId,
  } = useAppSelector((state) => state.users);
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    if (text.trim() === "" && !selectedCompanyId) {
      setFiltered(users);
    } else {
      // one or the othe or both
      const lowerText = text.toLowerCase();
      const isUsername = filterType === "name";

      const filteredUsers = users.filter((user) => {
        if (!isUsername && user.email !== null) {
          return user.email.toLowerCase().includes(lowerText);
        }

        const textCheck = user.username.toLowerCase().includes(lowerText);
        return textCheck;
      });
      setFiltered(filteredUsers);
    }
  }, [text, filterType]);

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

  const layout = selectedUserForm === "create" ? "w-full" : "w-1/2";

  const handleFilterTextChange = (x: string) => {
    setText(x);
  };

  const handleUserClick = (e: User) => {
    dispatch(setSelectedUserInfo(e));

    // Validating if the selected user is a registered QuickSight user
    if (qs.qsUsers.includes(e.email)) {
      dispatch(setSelectedQsUserEmail(e.email));
      dispatch(setValidUser(true));
    } else {
      dispatch(setSelectedQsUserEmail(""));
      dispatch(setValidUser(false));
    }

    dispatch(setSelectedUserId(e.id));
    getBaseGroupsAssignedToUser(url, token, e.id)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setAssignBaseGroups([...j.active, ...j.inactive]));
          const formatted = [...j.active].reduce(
            (acc: CompanyBaseGroup[], curr: BaseGroup) => {
              acc.push({
                id: curr.id,
                company: curr.company,
                name: curr.name,
              });
              return acc;
            },
            [],
          );
          dispatch(setAllSelectedBaseGroups(formatted));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching user's base groups " + err.message);
      });
  };

  return (
    <div className="w-full flex gap-4">
      <div
        className={`bg-[rgb(30,45,80)] text-custom-white rounded-lg shadow-lg p-2 text-sm flex gap-2 ${layout}`}
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
      {selectedUserForm === "update" && (
        <div className="w-1/2">
          <div className="grid grid-cols-2 mb-1.5 shadow-md">
            <button
              className={`${filterType === "name" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200 font-medium text-center rounded-l-lg py-1.5`}
              onClick={() => setFilterType("name")}
            >
              Username
            </button>
            <button
              className={`${filterType === "email" ? "bg-orange-200" : "bg-custom-white"}  font-medium text-center rounded-r-lg py-1.5`}
              onClick={() => setFilterType("email")}
            >
              Email
            </button>
          </div>
          <Input label="" value={text} setValue={handleFilterTextChange} />
          <div
            className={`${text.length ? "" : "hidden"} bg-custom-white min-h-20 max-h-20 overflow-hidden overflow-y-scroll no-scrollbar rounded-lg shadow-lg`}
          >
            {filtered.map((u) => (
              <div
                className="px-2 py-0.5 hover:bg-blue-200 cursor-pointer transition-all duration-200"
                onClick={() => handleUserClick(u)}
              >
                {u.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
