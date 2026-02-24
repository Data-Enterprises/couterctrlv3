import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, Store } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  resetUserInfo,
  setSelectedUserStores,
} from "../../../features/usersSlice";

import Assigned from "../assignModal/Assigned";
import Unassigned from "../assignModal/Unassigned";
import { getUserStores } from "../../../api/user";
import { useEffect } from "react";
import SearchUser from "../forms/SearchUser";
import { WarningIcon } from "../../../components/toasts/Icons";

const AssignStoresToUser = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId, users } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);

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

  const isOutranked = () => {
    const found = users.find((u) => u.id === selectedUserId);

    if (found) {
      return found.user_level > user.userLevel;
    }
    return false;
  };

  const handleReset = () => {
    dispatch(resetUserInfo());
    dispatch(setSelectedUserStores({ assigned: [], unassigned: [] }));
  };

  if (isOutranked()) {
    return (
      <div className="flex justify-center items-center bg-custom-white p-4 rounded-lg shadow-lg w-[50%]">
        <div className="font-medium text-sm flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div className="mb-2">We're sorry...</div>
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            className="btn-themeBlue py-1.5 mt-2"
            onClick={() => handleReset()}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

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
