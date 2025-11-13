import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getBaseGroupsAssignedToUser } from "../../api/team";
import { setBaseGroups, setRefresh } from "../../features/usersSlice";
import type { BaseGroup } from "../../interfaces";

import UserInfo from "./UserInfo";
import UserGrid from "./UserGrid";
import BaseGroups from "./BaseGroups";
import DeleteUserModal from "./DeleteUserModal";
import AssignStoresModal from "./assignModal/AssignStoresModal";

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { refresh } = useAppSelector((state) => state.users);
  const [dataReset, setDataReset] = useState<BaseGroup[]>([]);

  useEffect(() => {
    if (refresh) {
      getUsers();
      dispatch(setRefresh(false));
    }
  }, [refresh]);

  const getUsers = () => {
    getBaseGroupsAssignedToUser(context.url, context.token, 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setBaseGroups(j.groups));
          setDataReset(j.groups);
        }
      })
      .catch((err) => {
        toast.error("Error fetching base groups " + err.message);
      });

    return () => {
      dispatch(setBaseGroups(dataReset));
    };
  };

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <AssignStoresModal />
      <DeleteUserModal />
      <div className="grid grid-cols-2 gap-8 h-full">
        <div className="grid">
          <UserGrid />
        </div>
        <div className="grid grid-rows-2">
          <UserInfo />
          <BaseGroups />
        </div>
      </div>
    </div>
  );
};

export default Team;
