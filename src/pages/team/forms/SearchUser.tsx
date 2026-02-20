import { useEffect, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import type {
  BaseGroup,
  BaseGroupJsonResp,
  CompanyBaseGroup,
  JsonError,
  User,
} from "../../../interfaces";
import {
  setAssignBaseGroups,
  setSelectedUserId,
  setSelectedUserInfo,
  setUserFilterText,
} from "../../../features/usersSlice";
import { getBaseGroupsAssignedToUser } from "../../../api/team";
import {
  setAllSelectedBaseGroups,
  setBaseGroups,
} from "../../../features/baseGroupSlice";

const SearchUser = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { url, token } = useAppSelector((state) => state.app);
  const { userFilterText, selectedCompanyId, users, selectedUserId } = useAppSelector(
    (state) => state.users,
  );

  const [filterType, setFilterType] = useState<"name" | "email">("name");
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    dispatch(setUserFilterText(""));
  }, [selectedUserId])

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && listRef.current) {
      if (!listRef.current.contains(e.target as Node)) {
        if (!inputRef.current.contains(e.target as Node)) {
          listRef.current.setAttribute("data-display", "closed");
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (userFilterText.trim() === "" && !selectedCompanyId) {
      setFiltered(users);
    } else {
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
    }
  }, [userFilterText, filterType]);

  const handleFilterTextChange = (x: string) => {
    dispatch(setUserFilterText(x));
  };

  const handleUserClick = (e: User) => {
    dispatch(setSelectedUserInfo(e));
    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
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
  };

  const handleInputRefClick = () => {
    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "open");
    }
  };

  return (
    <div className="relative">
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
      <div className={`w-full`}>
        <input
          ref={inputRef}
          data-testid="search-user-input"
          value={userFilterText}
          onChange={(e) => handleFilterTextChange(e.currentTarget.value)}
          className={`basic-input focus:border w-full bg-custom-white`}
          onClick={handleInputRefClick}
        />
      </div>
      <div
        ref={listRef}
        data-display="closed"
        className={`data-[display=open]:absolute data-[display=closed]:hidden bg-custom-white w-full max-h-40 overflow-hidden overflow-y-scroll no-scrollbar rounded-lg shadow-lg`}
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
  );
};

export default SearchUser;
