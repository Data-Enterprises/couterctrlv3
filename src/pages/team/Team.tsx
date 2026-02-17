import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getQuicksightUsers } from "../../api/quicksight";
import { getUserLevels } from "../../api/team";
import { setRefresh, setUserLevels } from "../../features/usersSlice";
import { setQsUsers } from "../../features/qsSlice";
import type { JsonError, UserLevelJsonResp } from "../../interfaces";

import UserInfo from "./UserInfo";
import UserGrid from "./UserGrid";
import BaseGroups from "./BaseGroups";
import DeleteUserModal from "./DeleteUserModal";
import AssignStoresModal from "./assignModal/AssignStoresModal";
import AssignCompanyModal from "./modals/AssignCompanyModal";
import AssignBaseGroupModal from "./modals/AssignBaseGroupModal";

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { refresh } = useAppSelector((state) => state.users);

  useEffect(() => {
    if (refresh) {
      getQuicksightUsers(context.url, context.token)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setQsUsers(j.users));
          }
        })
        .catch((err: JsonError) => {
          toast.error("Error fetching QuickSight users " + err.message);
        });
      getUserLevels(context.url, context.token)
        .then((resp) => {
          const j: UserLevelJsonResp = resp.data;
          if (j.error === 0) {
            dispatch(setUserLevels(j.levels));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
      dispatch(setRefresh(false));
    }
  }, [refresh]);

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <AssignStoresModal />
      <DeleteUserModal />
      <AssignCompanyModal />
      <AssignBaseGroupModal />
      <div className="grid grid-cols-[54.26%_45%] gap-3 h-full">
        <div className="grid">
          <UserGrid />
        </div>
        <div className="grid grid-rows-[41%_59%]">
          <UserInfo />
          <BaseGroups />
        </div>
      </div>
    </div>
  );
};

export default Team;
