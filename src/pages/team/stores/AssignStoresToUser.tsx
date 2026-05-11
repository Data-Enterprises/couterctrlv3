import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, Store } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  resetUserInfo,
  setSelectedUserStores,
} from "../../../features/usersSlice";

import { getUserStores } from "../../../api/user";
import { useEffect } from "react";
import SearchUser from "../forms/SearchUser";
import { WarningIcon } from "../../../components/toasts/Icons";
import UpdateUserStores from "../users/UpdateUserStores";

const AssignStoresToUser = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId, users } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);

  useEffect(() => {
    if (selectedUserId === 0 || isOutranked()) return;

    const filterNulls = (arr: Store[]) => {
      return arr.filter((store) => store.store_name !== null);
    };

    getUserStores(url, token, selectedUserId)
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
      <div
        data-testid="bg-assign-outrank-container"
        className="flex justify-center items-center bg-custom-white p-4 rounded-lg shadow-lg w-[28%]"
      >
        <div className="font-medium text-[13px] flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            data-testid="bg-assign-outrank-reset-btn"
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white py-1 mt-2"
            onClick={() => handleReset()}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="user-store-form-main-container" className="grid gap-4 w-[50%]">
      <SearchUser />
      <UpdateUserStores />
    </div>
  );
};

export default AssignStoresToUser;
