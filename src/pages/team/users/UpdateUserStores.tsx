import { getUserStores } from "../../../api/user";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setRefresh,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import type { JsonError, Store } from "../../../interfaces";
import Assigned from "../assignModal/Assigned";
import Unassigned from "../assignModal/Unassigned";
import { useEffect } from "react";
import { setUserCompany } from "../../../features/baseGroupSlice";

const UpdateUserStores = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId } = useAppSelector((state) => state.users);

  useEffect(() => {
    if (selectedUserId) {
      dispatch(setUserCompany(null));
      getStores(selectedUserId);
    }
  }, [selectedUserId]);

  const getStores = (userid: number) => {
    const filterNulls = (arr: Store[]) => {
      return arr.filter((store) => store.store_name !== null);
    };
    getUserStores(url, token, userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores).sort(
              (a: Store, b: Store) =>
                parseInt(a.store_number) - parseInt(b.store_number),
            ),
            unassigned: filterNulls(j.unassigned_stores).sort(
              (a: Store, b: Store) =>
                parseInt(a.store_number) - parseInt(b.store_number),
            ),
          };
          dispatch(setSelectedUserStores(stores));
          dispatch(setRefresh(true));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
  };

  return (
    <div className="flex gap-2 max-h-[calc(100vh-6.95rem)] overflow-hidden">
      <Unassigned />
      <Assigned />
    </div>
  );
};

export default UpdateUserStores;
