import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError, User, UserLevelJsonResp } from "../../../interfaces";
import { getAllUsers } from "../../../api/user";
import { getUserLevels } from "../../../api/team";
import {
  resetUserInfo,
  setRefresh,
  setSelectedCompanyId,
  setSelectedForm,
  setSelectedUserForm,
  setSelectedUserId,
  setUserCompanyIds,
  setUserLevels,
  setUsers,
} from "../../../features/usersSlice";
import { setAllSelectedBaseGroups, setStoresWithBGID } from "../../../features/baseGroupSlice";
import TeamTablet from "../tabletComps/TeamTablet";
import TeamLegacy from "../TeamLegacy";
import Users from "./users/Users";

const TABS: { id: number; label: string; enabled: boolean }[] = [
  { id: 1, label: "Users", enabled: true },
  { id: 2, label: "Base groups", enabled: false },
  { id: 3, label: "Stores", enabled: false },
  { id: 4, label: "Companies", enabled: false },
  { id: 5, label: "Admin", enabled: false },
];

const Team = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isDesktop, isTablet } = useAppSelector((state) => state.app);
  const { companies } = useAppSelector((state) => state.user);
  const { refresh, selectedForm } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(setSelectedForm(1));
    return () => {
      dispatch(resetUserInfo());
      dispatch(setSelectedUserId(0));
      dispatch(setSelectedUserForm(""));
      dispatch(setUserCompanyIds([]));
      dispatch(setAllSelectedBaseGroups([]));
      dispatch(setStoresWithBGID([]));
      dispatch(setSelectedCompanyId(0));
    };
  }, []);

  useEffect(() => {
    dispatch(resetUserInfo());
    dispatch(setSelectedUserId(0));
    dispatch(setSelectedUserForm(""));
    dispatch(setUserCompanyIds([]));
    dispatch(setAllSelectedBaseGroups([]));
    dispatch(setStoresWithBGID([]));
    dispatch(setSelectedCompanyId(0));
  }, [selectedForm]);

  useEffect(() => {
    if (!refresh) return;
    getData();
    getUserLevels(url, token)
      .then((resp) => {
        const j: UserLevelJsonResp = resp.data;
        if (j.error === 0) dispatch(setUserLevels(j.levels));
      })
      .catch((err: JsonError) => toast.error(err.message));
    dispatch(setRefresh(false));
  }, [refresh]);

  const getData = () => {
    getAllUsers(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = companies.map((c) => c.company);
          const filtered = [...j.users].filter((u: User) => {
            const isDcrUser = u.companies.find((c) => c.company === 5 && c.name === "DCR");
            if (isDcrUser) return false;
            return u.companies.some((c) => companyIds.includes(c.company));
          });
          const isDcrUser = companies.find((c) => c.company === 5 && c.name === "DCR");
          dispatch(setUsers(isDcrUser ? j.users : filtered));
        }
      })
      .catch((err: JsonError) => toast.error("Error fetching users " + err.message));
  };

  if (isTablet) return <TeamTablet />;
  if (!isDesktop) return <TeamLegacy />;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div className="w-full max-w-4xl flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start">
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-white font-semibold text-[13px] flex-shrink-0">Team</span>
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.enabled && dispatch(setSelectedForm(tab.id))}
              disabled={!tab.enabled}
              className={`text-[12px] font-semibold py-2.5 whitespace-nowrap border-b-2 transition-colors flex-1 text-center ${
                !tab.enabled
                  ? "border-transparent text-content/30 cursor-not-allowed"
                  : selectedForm === tab.id
                    ? "border-[#1e2a4a] text-[#1e2a4a]"
                    : "border-transparent text-content"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {selectedForm === 1 && <Users />}
      </div>
    </div>
  );
};

export default Team;
