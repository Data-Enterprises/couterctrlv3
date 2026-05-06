import { useEffect, useState, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import type { User } from "../../../interfaces";
import {
  setSelectedUserId,
  setSelectedUserInfo,
  setUserFilterText,
  setUserFilterType,
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
    userFilterType,
  } = useAppSelector((state) => state.users);
  const [username, setUsername] = useState<string>("");
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
    // setUsername("");
    if (userFilterText.trim() === "" && !selectedCompanyId) {
      setFiltered(users);
    } else {
      // one or the othe or both
      const lowerText = userFilterText.toLowerCase();
      const isUsername = userFilterType === "name";

      const filteredUsers = users.filter((user) => {
        if (!isUsername && user.email !== null) {
          return user.email.toLowerCase().includes(lowerText);
        }

        const textCheck = user.username.toLowerCase().includes(lowerText);
        const companyCheck = selectedCompanyId
          ? user.companies.some((c) => c.company === selectedCompanyId)
          : true;
        return textCheck && companyCheck;
      });
      setFiltered(filteredUsers);
    }
  }, [userFilterText, userFilterType, selectedCompanyId]);

  const handleFilterTextChange = (x: string) => {
    if (username) {
      setUsername("");
    }

    dispatch(setUserFilterText(x));
    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "open");
    }
  };

  const handleUserClick = (e: User) => {
    // Setting the username to display in the input
    setUsername(e.username);
    // Setting the filter text to the username
    // This is to ensure that the input displays the username
    // But also if the user highlights the text or just starts typing
    // Then handleFilterTextChange will be triggered and the filter will work as expected
    // while not resetting the text to an empty string or the username
    dispatch(setUserFilterText(e.username));
    dispatch(setSelectedUserInfo(e));

    if (inputRef.current && listRef.current) {
      listRef.current.setAttribute("data-display", "closed");
    }

    dispatch(setSelectedUserId(e.id));
  };

  const handleInputRefClick = () => {
    if (username) {
      dispatch(setUserFilterText(username));
    }
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
    <div className="relative grid grid-cols-[55%_44%] gap-2 items-end text-[13px] -mt-2">
      <div className={`w-full relative`}>
        <div className={`w-full`}>
          <label className="font-medium pl-0.5">
            Search {userFilterType === "name" ? "Username" : "Email"} -{" "}
            {filtered.length}
          </label>
          <input
            ref={inputRef}
            data-testid="search-user-input"
            value={username ? username : userFilterText}
            onChange={(e) => handleFilterTextChange(e.currentTarget.value)}
            className={`basic-input focus:border w-full bg-custom-white py-1.5 text-sm`}
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
              data-testid={`search-user-${i}`}
              className="px-2 py-0.5 hover:bg-blue-200 cursor-pointer transition-all duration-200"
              onClick={() => handleUserClick(u)}
            >
              {u.username}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          data-testid="username-filter-btn"
          className={`w-1/2 ${userFilterType === "name" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200 font-medium text-center rounded-full shadow-md py-2`}
          onClick={() => dispatch(setUserFilterType("name"))}
        >
          Username
        </button>
        <button
          data-testid="email-filter-btn"
          className={`w-1/2 ${userFilterType === "email" ? "bg-orange-200" : "bg-custom-white"}  font-medium text-center rounded-full shadow-md py-2`}
          onClick={() => dispatch(setUserFilterType("email"))}
        >
          Email
        </button>
      </div>
    </div>
  );
};

export default SearchUser;
