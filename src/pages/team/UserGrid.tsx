import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/user";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, User } from "../../interfaces";
import { setUsers } from "../../features/usersSlice";

import { themeQuartz, type ColGroupDef, type ColDef } from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import { getUserLevelDescription } from ".";

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const [text, setText] = useState<string>("");

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
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      valueFormatter: (params) =>
        getUserLevelDescription(params.value as number),
    },
  ];

  useEffect(() => {
    getData();
  }, []);

  const getData = () => {
    getAllUsers(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setUsers(j.users));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching users " + err.message);
      });
  };

  const theme = themeQuartz.withParams({
    headerHeight: 30,
    rowHeight: 26.5,
    headerBackgroundColor: "#3b82f6",
    headerTextColor: "#ffffff",
    oddRowBackgroundColor: "#bfdbfe",
    rowHoverColor: "#93c5fd",
    headerFontWeight: "bold",
    dataFontSize: 13,
    selectCellBorder: "transparent",
    rowBorder: "1px solid white",
  });

  return (
    <div className="h-full w-full no-scrollbar">
      <div className="mb-2 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="basic-input focus:border"
          placeholder="Search Users"
        />
        <button className="btn-themeBlue">Add User</button>
      </div>
      <div className="h-[88%]">
        <AgGridReact
          className="no-scrollbar"
          rowData={useAppSelector((state) => state.users.users)}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationPageSize={11}
          paginationPageSizeSelector={false}
        />
      </div>
    </div>
  );
};

export default UserGrid;
