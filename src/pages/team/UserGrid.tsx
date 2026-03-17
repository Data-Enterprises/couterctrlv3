import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/user";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, User } from "../../interfaces";
import {
  setSelectedUserId,
  setSelectedUserInfo,
  setUsers,
  // setSelectedUserInfo,
  // setAssignBaseGroups,
  // setSelectedUserId,
  // setSelectedUserStores,
} from "../../features/usersSlice";
// import { getBaseGroupsAssignedToUser } from "../../api/team";

// For the table
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
  // type RowClickedEvent,
} from "ag-grid-community";
// import { setSelectedQsUserEmail, setValidUser } from "../../features/qsSlice";
import Input from "../../components/inputs/Input";
ModuleRegistry.registerModules([AllCommunityModule]);

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { users, refresh, selectedCompanyId, userLevels } = useAppSelector(
    (state) => state.users,
  );
  const { companies } = useAppSelector((state) => state.user);
  // const qs = useAppSelector((state) => state.quicksight);
  const [text, setText] = useState<string>("");
  const [filtered, setFiltered] = useState<User[]>([]);
  const [filterType, setFilterType] = useState<"name" | "email">("name");

  const colDefs: (ColDef<User> | ColGroupDef<User>)[] = [
    {
      headerName: "Name",
      field: "username",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Last Visit",
      field: "last_visit",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Email",
      field: "email",
      flex: 1,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Level",
      field: "user_level",
      flex: 0.72,
      resizable: false,
      // headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      valueFormatter: (params) => {
        const found = userLevels.find(
          (ul) => ul.id === params.data?.user_level,
        );
        return found ? found.name : "";
      },
    },
  ];

  useEffect(() => {
    if (refresh) {
      getData();
    }
  }, [refresh]);

  // Filter the table by searching for the username
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

  const getData = () => {
    getAllUsers(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = [...companies].map((c) => c.company);
          const filtered = [...j.users].filter((u: User) => {
            const isDcrUser = u.companies.find(
              (c) => c.company === 5 && c.name === "DCR",
            );

            if (isDcrUser) {
              return false;
            } else {
              let valid = false;
              u.companies.forEach((c) => {
                if (companyIds.includes(c.company)) {
                  valid = true;
                  return;
                }
              });
              return valid;
            }
          });

          const isDcrUser = companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );

          if (isDcrUser) {
            // aka Stephn/Tommy/Mike
            dispatch(setUsers(j.users));
            setFiltered(j.users);
          } else {
            dispatch(setUsers(filtered));
            setFiltered(filtered);
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching users " + err.message);
      });
  };

  const handleRowClick = (e: RowClickedEvent) => {
    dispatch(setSelectedUserInfo(e.data));
    dispatch(setSelectedUserId(e.data.id));

    // Validating if the selected user is a registered QuickSight user
    // if (qs.qsUsers.includes(e.data.email)) {
    //   dispatch(setSelectedQsUserEmail(e.data.email));
    //   dispatch(setValidUser(true));
    // } else {
    //   dispatch(setSelectedQsUserEmail(""));
    //   dispatch(setValidUser(false));
    // }

    // const filterNulls = (arr: Store[]) => {
    //   return arr.filter((store) => store.store_name !== null);
    // };

    // getUserStores(context.url, context.token, selectedUserId)
    //   .then((resp) => {
    //     const j = resp.data;
    //     if (j.error === 0) {
    //       const stores = {
    //         assigned: filterNulls(j.assigned_stores),
    //         unassigned: filterNulls(j.unassigned_stores),
    //       };
    //       dispatch(setSelectedUserStores(stores));
    //     }
    //   })
    //   .catch((err: JsonError) => {
    //     toast.error("Error fetching available stores " + err.message);
    //   });
  };

  const handleFilterTextChange = (x: string) => {
    setText(x);
  };

  return (
    <div
      data-testid="user-grid-container"
      className="w-full h-full no-scrollbar"
    >
      <div className="mb-4 flex items-end gap-2">
        <div className="w-full">
          <div className="grid grid-cols-2 mb-1.5 shadow-md">
            <button
              data-testid="name-filter-btn"
              className={`${filterType === "name" ? "bg-orange-200" : "bg-custom-white"} transition-all duration-200 font-medium text-center rounded-l-lg py-1.5`}
              onClick={() => setFilterType("name")}
            >
              Username
            </button>
            <button
              data-testid="email-filter-btn"
              className={`${filterType === "email" ? "bg-orange-200" : "bg-custom-white"}  font-medium text-center rounded-r-lg py-1.5`}
              onClick={() => setFilterType("email")}
            >
              Email
            </button>
          </div>
          <Input label="" value={text} setValue={handleFilterTextChange} />
        </div>
      </div>
      <div className="h-[78%]">
        <AgGridReact
          className="no-scrollbar"
          rowData={filtered}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          paginationPageSizeSelector={false}
          onRowClicked={handleRowClick}
          rowSelection={"single"}
        />
      </div>
    </div>
  );
};

export default UserGrid;
