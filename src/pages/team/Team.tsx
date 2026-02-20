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

import UserControls from "./forms/UserControls";
import FormHeader from "./forms/FormHeader";
import CounterCtrlStores from "./assignModal/CounterCtrlStores";
import { getAllUsers } from "../../api/user";
import StoresForm from "./stores/StoresForm";
import BaseGroupControls from "./baseGroups/BaseGroupControls";

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
        return <BaseGroupControls />;
      case 3:
        return <StoresForm />;
      default:
        return null;
    }
  };

  return (
    <div data-testid="team-page" className={`w-full h-[calc(100vh-3rem)] p-4`}>
      <div className="flex gap-3 h-full">
        <div className="">
          <FormHeader />
        </div>
        <div className={`w-[55%] space-y-4`}>
          {renderForm()}
        </div>
        <div className="w-[45%]">{selectedForm !== 3 && <CounterCtrlStores />}</div>
      </div>
    </div>
  );
};

export default Team;
