import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getQuicksightUsers } from "../../api/quicksight";
import { getUserLevels } from "../../api/team";
import {
  setAssignBaseGroups,
  setRefresh,
  setUserLevels,
  setUsers,
} from "../../features/usersSlice";
import { setQsUsers } from "../../features/qsSlice";
import type { JsonError, User, UserLevelJsonResp } from "../../interfaces";

// import UserGrid from "./UserGrid";
// import DeleteUserModal from "./DeleteUserModal";
// import AssignStoresModal from "./assignModal/AssignStoresModal";
// import AssignCompanyModal from "./modals/AssignCompanyModal";
// import AssignBaseGroupModal from "./modals/AssignBaseGroupModal";
import UserControls from "./forms/UserControls";
import FormHeader from "./forms/FormHeader";
import CounterCtrlStores from "./assignModal/CounterCtrlStores";
import ProfileCard from "./forms/ProfileCard";
import { getAllUsers } from "../../api/user";
// import UserGrid from "./UserGrid";

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { refresh, selectedUserId, selectedForm } = useAppSelector(
    (state) => state.users,
  );

  useEffect(() => {
    if (refresh) {
      getData();
    }
  }, [refresh]);

  const getData = () => {
    getAllUsers(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = [...companies].map((c) => c.company);
          const filtered = [...j.users].filter((u: User) => {
            const isDcrUser = u.companies.find(
              (c) => c.company === 5 && c.name === "DCR",
            );

            if (isDcrUser) {
              return false;
            } else {
              let valid = false;
              u.companies.forEach((c) => {
                if (companyIds.includes(c.company)) {
                  valid = true;
                  return;
                }
              });
              return valid;
            }
          });

          const isDcrUser = companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );

          if (isDcrUser) {
            dispatch(setUsers(j.users));
          } else {
            dispatch(setUsers(filtered));
          }
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching users " + err.message);
      });
  };

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
      {/* <AssignStoresModal />
      <DeleteUserModal />
      <AssignCompanyModal />
      <AssignBaseGroupModal /> */}
      <div className="flex gap-3 h-full">
        <div className="">
          <FormHeader />
          {/* <div>
            {users.map((u) => (
              <div>
                <div>{u.username}</div>
              </div>
            ))}
          </div> */}
        </div>
        <div className="w-1/2 space-y-4">
          <ProfileCard />
          {renderForm()}
        </div>
        <div>
          <CounterCtrlStores />
        </div>
      </div>
    </div>
  );
};

export default Team;
