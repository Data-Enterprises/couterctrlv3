import { useEffect, useState } from "react";
import { getAllUsers } from "../../api/user";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, User } from "../../interfaces";
import { setUsers, resetUserInfo } from "../../features/usersSlice";

// For the table
import { AgGridReact } from "ag-grid-react";
import { colDefs, theme } from ".";

const UserGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users.users);
  const [text, setText] = useState<string>("");
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    getData();
  }, []);

  // Filter the table by searching for the username
  useEffect(() => {
    if (text.trim() === "") {
      setFiltered(users);
    } else {
      const lowerText = text.toLowerCase();
      const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(lowerText)
      );
      setFiltered(filteredUsers);
    }
  }, [text]);

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

  const handleReset = () => {
    dispatch(resetUserInfo());
  };

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
        <button className="btn-themeBlue" onClick={handleReset}>
          Add User
        </button>
      </div>
      <div className="h-[88%]">
        <AgGridReact
          className="no-scrollbar"
          rowData={filtered}
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
