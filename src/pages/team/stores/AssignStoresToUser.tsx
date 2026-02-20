import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, Store } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { setSelectedUserStores } from "../../../features/usersSlice";

import Assigned from "../assignModal/Assigned";
import Unassigned from "../assignModal/Unassigned";
import { getUserStores } from "../../../api/user";
import { useEffect } from "react";
import SearchUser from "../forms/SearchUser";

const AssignStoresToUser = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId } = useAppSelector((state) => state.users);


  useEffect(() => {
    if (selectedUserId === 0) return;

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
  }, [selectedUserId]);

  return (
    <div className="grid gap-4 w-[50%]">
      <SearchUser />
      <div className="grid grid-cols-2 gap-x-4">
        <Unassigned />
        <Assigned />
      </div>
    </div>
  );
};

export default AssignStoresToUser;
