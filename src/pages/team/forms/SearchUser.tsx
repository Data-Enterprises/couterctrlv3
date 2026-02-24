import { useEffect, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import type { User } from "../../../interfaces";
import {
  setSelectedUserId,
  setSelectedUserInfo,
  setUserFilterText,
} from "../../../features/usersSlice";

const SearchUser = () => {
  const dispatch = useAppDispatch();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const {
    userFilterText,
    selectedCompanyId,
    users,
    selectedUserId,
    selectedUserForm,
  } = useAppSelector((state) => state.users);
  const [username, setUsername] = useState<string>("");

  const [filterType, setFilterType] = useState<"name" | "email">("name");
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    setUsername("");
  }, [selectedUserForm]);

  useEffect(() => {
    dispatch(setUserFilterText(""));
  }, [selectedUserId]);

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
    setUsername("");
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
    setUsername(e.username);
    dispatch(setSelectedUserInfo(e));
    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
    }

    dispatch(setSelectedUserId(e.id));
  };

  const handleInputRefClick = () => {
    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "open");
    }
  };

  const handleBackSpace = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      setUsername("");
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
          value={username ? username : userFilterText}
          onChange={(e) => handleFilterTextChange(e.currentTarget.value)}
          className={`basic-input focus:border w-full bg-custom-white`}
          onClick={handleInputRefClick}
          onKeyDown={handleBackSpace}
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
