import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getQuicksightUsers } from "../../api/quicksight";
import { getUserLevels } from "../../api/team";
import {
  setAssignBaseGroups,
  setRefresh,
  setUserLevels,
} from "../../features/usersSlice";
import { setQsUsers } from "../../features/qsSlice";
import type { JsonError, UserLevelJsonResp } from "../../interfaces";

import UserGrid from "./UserGrid";
import DeleteUserModal from "./DeleteUserModal";
import AssignStoresModal from "./assignModal/AssignStoresModal";
import AssignCompanyModal from "./modals/AssignCompanyModal";
import AssignBaseGroupModal from "./modals/AssignBaseGroupModal";
import UserControls from "./forms/UserControls";
import FormHeader from "./forms/FormHeader";

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { refresh, selectedUserId, selectedForm } = useAppSelector(
    (state) => state.users,
  );

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

  useEffect(() => {
    dispatch(setAssignBaseGroups([]));
  }, [selectedUserId]);

  const renderForm = () => {
    switch (selectedForm) {
      case 1:
        return <UserControls />;
      case 2:
        return <div>Base Group Controls</div>;
      case 3:
        return <div>Company Controls</div>;
      default:
        return null;
    }
  };

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <AssignStoresModal />
      <DeleteUserModal />
      <AssignCompanyModal />
      <AssignBaseGroupModal />
      <div className="grid grid-cols-[54%_44%] gap-3 h-full">
        <div className="grid">
          <UserGrid />
        </div>
        <div className="space-y-4">
          <FormHeader />
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default Team;
