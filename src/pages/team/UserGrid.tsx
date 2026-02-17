import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/user";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { BaseGroupJsonResp, JsonError, User } from "../../interfaces";
import {
  setUsers,
  setSelectedUserInfo,
  setAssignBaseGroups,
  setSelectedUserId,
} from "../../features/usersSlice";
import { getBaseGroupsAssignedToUser } from "../../api/team";

// For the table
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
import { setSelectedQsUserEmail, setValidUser } from "../../features/qsSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const {
    users,
    refresh,
    selectedCompanyId,
    userLevels,
    selectedForm,
    selectedUserForm,
  } = useAppSelector((state) => state.users);
  const { companies } = useAppSelector((state) => state.user);
  const qs = useAppSelector((state) => state.quicksight);
  const [text, setText] = useState<string>("");
  const [filtered, setFiltered] = useState<User[]>([]);

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
      const filteredUsers = users.filter((user) => {
        const textCheck = user.username.toLowerCase().includes(lowerText);
        // const companyCheck =
        //   selectedCompanyId > 0 ? user.company === selectedCompanyId : true;
        // return textCheck && companyCheck;
        return textCheck;
      });
      setFiltered(filteredUsers);
    }
  }, [text]);

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
    if (selectedForm === 1 && selectedUserForm === "create") {
      return;
    }
    dispatch(setSelectedUserInfo(e.data));

    // Validating if the selected user is a registered QuickSight user
    if (qs.qsUsers.includes(e.data.email)) {
      dispatch(setSelectedQsUserEmail(e.data.email));
      dispatch(setValidUser(true));
    } else {
      dispatch(setSelectedQsUserEmail(""));
      dispatch(setValidUser(false));
    }

    dispatch(setSelectedUserId(e.data.id));
    getBaseGroupsAssignedToUser(context.url, context.token, e.data.id)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setAssignBaseGroups([...j.active, ...j.inactive]));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching user's base groups " + err.message);
      });
  };

  return (
    <div data-testid="user-grid-container" className="w-full no-scrollbar">
      <div className="mb-2 flex items-end gap-2">
        <div className="-mt-1">
          <label className="text-sm font-medium pl-0.5">Name</label>
          <input
            data-testid="user-grid-search"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="basic-input focus:border bg-custom-white"
            placeholder="Search Users"
          />
        </div>
      </div>
      <div className="h-[91.5%]">
        <AgGridReact
          className="no-scrollbar"
          rowData={filtered}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          paginationPageSizeSelector={false}
          onRowClicked={handleRowClick}
        />
      </div>
    </div>
  );
};

export default UserGrid;
