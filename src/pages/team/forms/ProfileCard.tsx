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
  setUserFilterText,
} from "../../../features/usersSlice";
import {
  setSelectedQsUserEmail,
  setValidUser,
} from "../../../features/qsSlice";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import {
  setAllSelectedBaseGroups,
  setBaseGroups,
} from "../../../features/baseGroupSlice";

const ProfileCard = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const qs = useAppSelector((state) => state.quicksight);
  const { url, token } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const [filterType, setFilterType] = useState<"name" | "email">("name");
  const {
    userInfo,
    userCompanyIds,
    userLevels,
    selectedUserForm,
    users,
    userFilterText,
  } = useAppSelector((state) => state.users);
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [showList, setShowList] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    dispatch(setUserFilterText(""));
  }, [selectedUserForm]);

  useEffect(() => {
    if (username) {
      setShowList(false);
      dispatch(setUserFilterText(username));
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      setUsername("");
    }

    if (userFilterText.trim() === "" && !username) {
      setFiltered(users);
    } else if (!username) {
      // one or the othe or both
      const lowerText = userFilterText.toLowerCase();
      const isUsername = filterType === "name";

      const filteredUsers = users.filter((user) => {
        if (!isUsername && user.email !== null) {
          return user.email.toLowerCase().includes(lowerText);
        }

        const textCheck = user.username.toLowerCase().includes(lowerText);
        return textCheck;
      });
      setFiltered(filteredUsers);
      setShowList(true);
    }
  }, [userFilterText, filterType]);

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

  const handleFilterTextChange = (x: string) => {
    dispatch(setUserFilterText(x));
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
          dispatch(setBaseGroups(j.active));
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

    setUsername(e.username);
    setShowList(false);
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
      {selectedUserForm !== "create" && selectedUserForm !== "user_info" && (
        <div className="relative mt-4">
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
          <Input
            label=""
            value={userFilterText}
            setValue={handleFilterTextChange}
          />
          <div
            className={`${showList ? "absolute" : "hidden"} bg-custom-white w-full max-h-40 overflow-hidden overflow-y-scroll no-scrollbar rounded-lg shadow-lg`}
            style={{ zIndex: 9999 }}
          >
            {filtered.map((u, i) => (
              <div
                key={i}
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
