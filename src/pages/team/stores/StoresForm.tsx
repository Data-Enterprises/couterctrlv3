import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import Input from "../../../components/inputs/Input";
import Assigned from "../assignModal/Assigned";
import Unassigned from "../assignModal/Unassigned";
import type { JsonError, Store, User } from "../../../interfaces";
import {
  setSelectedUserId,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import { getUserStores } from "../../../api/user";
import { useToast } from "../../../components/toasts/hooks/useToast";
// import SearchUser from "../forms/SearchUser";
// import UserGrid from "../UserGrid";
import StoreInfo from "./StoreInfo";
import AssignBaseGroup from "./AssignBaseGroup";

type StoreFormOption = "assign" | "info" | "bg_assign" | "";

const StoresForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [showList, setShowList] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [filtered, setFiltered] = useState<User[]>([]);
  const [filterType, setFilterType] = useState<"name" | "email">("name");

  const handleFilterTextChange = (x: string) => {
    setShowList(true);
    setText(x);
  };
  const { url, token } = useAppSelector((state) => state.app);
  const { users } = useAppSelector((state) => state.users);
  const [option, setOption] = useState<StoreFormOption>("");

  useEffect(() => {
    if (username) {
      setShowList(false);
      setText(username);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      setUsername("");
    }

    if (text.trim() === "" && !username) {
      setFiltered(users);
      // setShowList(false);
    } else if (!username) {
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
      setShowList(true);
    }
  }, [text, filterType]);

  const handleUserClick = (e: User) => {
    // Validating if the selected user is a registered QuickSight user
    // if (qs.qsUsers.includes(e.email)) {
    //   dispatch(setSelectedQsUserEmail(e.email));
    //   dispatch(setValidUser(true));
    // } else {
    //   dispatch(setSelectedQsUserEmail(""));
    //   dispatch(setValidUser(false));
    // }

    dispatch(setSelectedUserId(e.id));

    const filterNulls = (arr: Store[]) => {
      return arr.filter((store) => store.store_name !== null);
    };

    getUserStores(url, token, e.id)
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

    // setText(e.username);
    setUsername(e.username);
    setShowList(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-custom-white p-4 w-1/2 rounded-lg shadow-lg grid grid-cols-3 gap-2">
        <button
          className={`${option === "assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("assign")}
        >
          Assign/Unassign
        </button>
        <button
          className={`${option === "info" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("info")}
        >
          Store Info
        </button>
        <button
          className={`${option === "bg_assign" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
          onClick={() => setOption("bg_assign")}
        >
          Base Group Assign
        </button>
      </div>
      {option === "assign" && (
        <div className="grid gap-4">
          <div className="w-1/2 relative">
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
              className={`${showList ? "absolute" : "hidden"} bg-custom-white w-full max-h-40 overflow-hidden overflow-y-scroll no-scrollbar rounded-lg shadow-lg`}
              style={{ zIndex: 9999 }}
            >
              {filtered.map((u, i) => (
                <div
                  key={i}
                  className="px-2 py-0.5 hover:bg-blue-200 cursor-pointer transition-all duration-200"
                  onClick={() => handleUserClick(u)}
                >
                  {filterType === "name" ? u.username : u.email}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 w-1/2">
            <Unassigned />
            <Assigned />
          </div>
        </div>
      )}

      {option === "info" && <StoreInfo />}
      {option === "bg_assign" && <AssignBaseGroup />}
    </div>
  );
};

// const AssignUserStores = () => {
//   return (
//     <div className="grid gap-4">
//       <SearchUser />
//       <div className="grid grid-cols-2 gap-4 w-1/2">
//         <Unassigned />
//         <Assigned />
//       </div>
//     </div>
//   );
// };

export default StoresForm;
