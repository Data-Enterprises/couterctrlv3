import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getQuicksightUsers } from "../../api/quicksight";
import { getBaseGroupsAssignedToUser, getCompanyList } from "../../api/team";
import { setAllCompanies, setBaseGroups, setRefresh } from "../../features/usersSlice";
import { setQsUsers } from "../../features/qsSlice";
import type { CompanyJsonResp, JsonError } from "../../interfaces";

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

  useEffect(() => {
    getCompanyList(context.url, context.token)
      .then((resp) => {
        const j: CompanyJsonResp = resp.data;

        if (j.error === 0) {
          dispatch(setAllCompanies(j.companies));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

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
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching base groups " + err.message);
      });
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
