import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/user";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { BaseGroup, JsonError, User } from "../../interfaces";
import {
  setUsers,
  setSelectedUserInfo,
  setBaseGroups,
  setSelectedUserId,
  // setSelectedCompanyId,
  // setBaseGroupModalOpen,
} from "../../features/usersSlice";
import { getBaseGroupsAssignedToUser } from "../../api/team";

// For the table
import { AgGridReact } from "ag-grid-react";
import { colDefs, theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import { setSelectedQsUserEmail, setValidUser } from "../../features/qsSlice";
// import SingleSelect from "../../components/SingleSelect";
ModuleRegistry.registerModules([AllCommunityModule]);

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // const { companies } = useAppSelector((state) => state.user);
  const { users, refresh, selectedCompanyId } = useAppSelector(
    (state) => state.users,
  );
  const { companies } = useAppSelector((state) => state.user);
  const qs = useAppSelector((state) => state.quicksight);
  const [text, setText] = useState<string>("");
  const [filtered, setFiltered] = useState<User[]>([]);

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
    dispatch(setSelectedUserInfo(e.data));
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
        const j = resp.data;
        if (j.error === 0) {
          const sorted = [...j.groups].sort((a: BaseGroup, b: BaseGroup) =>
            a.active > b.active ? -1 : 1,
          );
          dispatch(setBaseGroups(sorted));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching user's base groups " + err.message);
      });
  };

  // const handleCompanySelect = (companyId: string | number) => {
  //   dispatch(setSelectedCompanyId(companyId as number));
  // };

  // const handleBaseGroupModalOpen = () => {
  //   dispatch(setBaseGroupModalOpen(true));
  // };

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
        {/* <SingleSelect
          label="Company"
          data={companies}
          displayKey="name"
          valueKey="company"
          className={`${companies.length < 2 && "hidden"}`}
          onSelect={handleCompanySelect}
        />
        <button
          className={`btn-themeBlue ${!selectedCompanyId && "opacity-50 pointer-events-none"}`}
          onClick={handleBaseGroupModalOpen}
        >
          Base Groups
        </button> */}
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
