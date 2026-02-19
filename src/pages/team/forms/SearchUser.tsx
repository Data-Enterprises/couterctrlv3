import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { User } from "../../../interfaces";
import { setSelectedUserInfo, setUserFilterText } from "../../../features/usersSlice";
import Input from "../../../components/inputs/Input";

const SearchUser = () => {
  const dispatch = useAppDispatch();
  const { userFilterText, selectedCompanyId, users } = useAppSelector(
    (state) => state.users,
  );

  const [filterType, setFilterType] = useState<"name" | "email">("name");
  const [filtered, setFiltered] = useState<User[]>([]);

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

    // Validating if the selected user is a registered QuickSight user
    // if (qs.qsUsers.includes(e.email)) {
    //   dispatch(setSelectedQsUserEmail(e.email));
    //   dispatch(setValidUser(true));
    // } else {
    //   dispatch(setSelectedQsUserEmail(""));
    //   dispatch(setValidUser(false));
    // }

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

    const filterNulls = (arr: Store[]) => {
      return arr.filter((store) => store.store_name !== null);
    };

    getUserStores(url, token, selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores),
            unassigned: filterNulls(j.unassigned_stores),
          };
          dispatch(setSelectedUserStores(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
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
      <Input
        label=""
        value={userFilterText}
        setValue={handleFilterTextChange}
      />
      <div
        className={`${userFilterText.length ? "absolute" : "hidden"} bg-custom-white w-full max-h-40 overflow-hidden overflow-y-scroll no-scrollbar rounded-lg shadow-lg`}
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
