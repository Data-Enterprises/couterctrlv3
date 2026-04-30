import { useEffect } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setRefresh,
  setSelectedForm,
  setUserLevels,
  setUsers,
} from "../../../features/usersSlice";

import { getAllUsers } from "../../../api/user";
import { getUserLevels } from "../../../api/team";

import type { JsonError, User, UserLevelJsonResp } from "../../../interfaces";

// Components
import MainFormOption from "./MainFormOption";
import UsersTablet from "./users/UsersTablet";
import BaseGroupsTablet from "./baseGroups/BaseGroupsTablet";
import StoresTablet from "./stores/StoresTablet";
import CompaniesTablet from "./company/CompaniesTablet";
import AdminTablet from "./admin/AdminTablet";

const TeamTablet = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const companies = useAppSelector((state) => state.user.companies);
  const { selectedForm, refresh } = useAppSelector((state) => state.users);

  useEffect(() => {
    if (refresh) {
      getUsers();
    }
  }, [refresh]);

  const getUsers = () => {
    getUserLevels(url, token)
      .then((resp) => {
        const j: UserLevelJsonResp = resp.data;
        if (j.error === 0) {
          dispatch(setUserLevels(j.levels));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    getAllUsers(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Going to use the current user's companies to filter
          const companyIds = [...companies].map((c) => c.company);

          // grabbing non-DCR users
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

          // Now we check to see if the logged in user is a DCR user
          const isDcrUser = companyIds.includes(5);

          if (isDcrUser) {
            dispatch(setUsers(j.users));
          } else {
            dispatch(setUsers(filtered));
          }
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching all users. " + err.message),
      )
      .finally(() => dispatch(setRefresh(false)));
  };

  const handleMainFormSelect = (form: number) => {
    dispatch(setSelectedForm(form));
  };

  const renderMainForm = () => {
    switch (selectedForm) {
      case 1:
        return <UsersTablet />;
      case 2:
        return <BaseGroupsTablet />;
      case 3:
        return <StoresTablet />;
      case 4:
        return <CompaniesTablet />;
      case 5:
        return <AdminTablet />;
      default:
        return (
          <div className="grid grid-cols-5 gap-3">
            <MainFormOption
              title="Users"
              handleFormSelect={handleMainFormSelect}
              form={1}
            />
            <MainFormOption
              title="Base Groups"
              handleFormSelect={handleMainFormSelect}
              form={2}
            />
            <MainFormOption
              title="Stores"
              handleFormSelect={handleMainFormSelect}
              form={3}
            />
            <MainFormOption
              title="Company"
              handleFormSelect={handleMainFormSelect}
              form={4}
            />
            <MainFormOption
              title="Admin"
              handleFormSelect={handleMainFormSelect}
              form={5}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full overflow-hidden p-2 select-none">
      {renderMainForm()}
    </div>
  );
};

export default TeamTablet;
