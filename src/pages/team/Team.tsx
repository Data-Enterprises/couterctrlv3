import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import {
  resetUserInfo,
  setAssignBaseGroups,
  setRefresh,
  setSelectedForm,
  setSelectedUserForm,
  setSelectedUserId,
  setUserLevels,
  setUsers,
} from "../../features/usersSlice";
import { setQsUsers } from "../../features/qsSlice";
import { setSelectedCompanyForm } from "../../features/companySlice";
import type { JsonError, User, UserLevelJsonResp } from "../../interfaces";

import { getQuicksightUsers } from "../../api/quicksight";
import { getUserLevels } from "../../api/team";
import { getAllUsers } from "../../api/user";

import UserControls from "./forms/UserControls";
import MainForms from "./forms/MainForms";
import StoreControls from "./stores/StoreControls";
import BaseGroupControls from "./baseGroups/BaseGroupControls";
import CompanyControls from "./company/CompanyControls";
import SingleSelect from "../../components/SingleSelect";
import AdminControls from "./admin/AdminControls";
import {
  setNewStoreNameText,
  setSelectedStoreInfo,
} from "../../features/adminSlice";
import ExportMissingStoresModal from "./admin/ExportMissingStoresModal";
import { adminMissingSalesColumns } from "./admin";
import Assigned from "./assignModal/Assigned";
import Unassigned from "./assignModal/Unassigned";
import TeamTablet from "./tabletComps/TeamTablet";

const options = [
  { label: "Users", value: 1 },
  { label: "Base Groups", value: 2 },
  { label: "Stores", value: 3 },
  { label: "Companies", value: 4 },
];

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isDesktop, isTablet } = useAppSelector((state) => state.app);
  const companies = useAppSelector((state) => state.user.companies);
  const { refresh, selectedUserId, selectedForm, selectedUserStores } =
    useAppSelector((state) => state.users);

  const { filteredMissingStores } = useAppSelector((state) => state.admin);

  useEffect(() => {
    return () => {
      dispatch(setSelectedUserId(0));
      dispatch(resetUserInfo());
      dispatch(setSelectedForm(0));
      dispatch(setSelectedUserForm(""));
      dispatch(setSelectedCompanyForm(""));
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedUserId(0));
    dispatch(resetUserInfo());
    dispatch(setSelectedUserForm(""));
    dispatch(setSelectedCompanyForm(""));
    dispatch(setSelectedStoreInfo(null));
    dispatch(setNewStoreNameText(""));
  }, [selectedForm]);

  useEffect(() => {
    if (refresh) {
      getData();
    }
  }, [refresh]);

  const getData = () => {
    getAllUsers(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // mapping the company ids for easier filtering
          const companyIds = [...companies].map((c) => c.company);

          // creating a filtered list uf non-DCR users
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

          // Checking if the logged in/current user is a DCR user
          const isDcrUser = companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );

          // DCR users should be able to see everyone (for support puposes)
          if (isDcrUser) {
            dispatch(setUsers(j.users));
          } else {
            // Otherwise, we show only the other users who are also assigned to the same company/companies as the logged in user
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
      getQuicksightUsers(url, token)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setQsUsers(j.users));
          }
        })
        .catch((err: JsonError) => {
          toast.error("Error fetching QuickSight users " + err.message);
        });
      getUserLevels(url, token)
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

  if (isTablet) return <TeamTablet />;

  const renderForm = () => {
    switch (selectedForm) {
      case 1:
        return <UserControls />;
      case 2:
        return <BaseGroupControls />;
      case 3:
        return <StoreControls />;
      case 4:
        return <CompanyControls />;
      case 5:
        return <AdminControls />;
      default:
        return null;
    }
  };

  const handleMobileFormSelect = (val: string | number) => {
    const form = Number(val);
    dispatch(setSelectedForm(form));
  };

  return (
    <div
      data-testid="team-page"
      className={`w-full ${isDesktop ? "h-[calc(100vh-3rem)]" : ""} p-4`}
    >
      {isDesktop ? (
        <div className="flex gap-3 h-full">
          <ExportMissingStoresModal
            data={filteredMissingStores}
            columns={adminMissingSalesColumns}
          />
          <div className="min-w-[178px] max-w-[178px]">
            <MainForms />
          </div>
          <div
            className={`${selectedForm !== 3 ? "w-[63%]" : "w-full"} space-y-4`}
          >
            {renderForm()}
          </div>
          {selectedForm !== 3 && (
            <div className="w-[45%]">
              <div
                data-testid="ctrl-store-assign"
                className={`grid grid-cols-2 gap-4 h-[65vh] ${selectedUserStores.unassigned.length || selectedUserStores.assigned.length ? "" : "hidden"}`}
              >
                <Unassigned />
                <Assigned />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div>
            <SingleSelect
              label="Forms"
              data={options}
              displayKey="label"
              valueKey="value"
              onSelect={handleMobileFormSelect}
            />
          </div>
          <div className="pt-4">{renderForm()}</div>
        </div>
      )}
    </div>
  );
};

export default Team;
