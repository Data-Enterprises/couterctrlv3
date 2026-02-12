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
import SingleSelect from "../../components/SingleSelect";
ModuleRegistry.registerModules([AllCommunityModule]);

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { users, refresh, allCompanies } = useAppSelector((state) => state.users);
  const qs = useAppSelector((state) => state.quicksight);
  const [text, setText] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState<number>(0);
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    if (refresh) {
      getData();
    }
  }, [refresh]);

  // Filter the table by searching for the username
  useEffect(() => {
    if (text.trim() === "" && !companyFilter) {
      setFiltered(users);
    } else {
      // one or the othe or both
      const lowerText = text.toLowerCase();
      const filteredUsers = users.filter((user) => {
        const textCheck = user.username.toLowerCase().includes(lowerText);
        const companyCheck = companyFilter > 0 ? user.company === companyFilter : true;
        return textCheck && companyCheck;
      });
      setFiltered(filteredUsers);
    }
  }, [text, companyFilter]);

  const getData = () => {
    getAllUsers(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setUsers(j.users));
          setFiltered(j.users);
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

  const handleCompanySelect = (companyId: string | number) => {
    setCompanyFilter(companyId as number);
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
        <SingleSelect
          label="Company"
          data={allCompanies}
          displayKey="name"
          valueKey="id"
          className=""
          onSelect={handleCompanySelect}
        />
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
