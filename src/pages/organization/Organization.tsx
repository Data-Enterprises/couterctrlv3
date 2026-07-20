import { useEffect, useState } from "react";
import { useOrganizationCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, User, UserLevelJsonResp } from "../../interfaces";
import { getAllUsers } from "../../api/user";
import { getUserLevels } from "../../api/team";
import {
  setRefresh as setUsersRefresh,
  setUserLevels,
  setUsers,
} from "../../features/usersSlice";
import TeamTablet from "../team/tabletComps/TeamTablet";
import TeamLegacy from "../team/TeamLegacy";
import Users from "./users/Users";
import BaseGroups from "./baseGroups/BaseGroups";
import StoresDirectory from "./stores/StoresDirectory";

type Tab = "users" | "baseGroups" | "stores";

const TAB_LABELS: Record<Tab, string> = {
  users: "Users",
  baseGroups: "Base Groups",
  stores: "Stores",
};

const Organization = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const [tab, setTab] = useState<Tab>("users");

  useEffect(() => {
    if (!ctx.refresh) return;
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = ctx.companies.map((c) => c.company);
          const filtered = [...j.users].filter((u: User) => {
            const isDcrUser = u.companies.find(
              (c) => c.company === 5 && c.name === "DCR",
            );
            if (isDcrUser) return false;
            return u.companies.some((c) => companyIds.includes(c.company));
          });
          const isDcrUser = ctx.companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );
          ctx.dispatch(setUsers(isDcrUser ? j.users : filtered));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching users " + err.message),
      );
    getUserLevels(ctx.url, ctx.token)
      .then((resp) => {
        const j: UserLevelJsonResp = resp.data;
        if (j.error === 0) ctx.dispatch(setUserLevels(j.levels));
      })
      .catch((err: JsonError) => toast.error(err.message));
    ctx.dispatch(setUsersRefresh(false));
  }, [ctx.refresh]);

  if (ctx.isTablet) return <TeamTablet />;
  if (!ctx.isDesktop) return <TeamLegacy />;

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div className="w-fit max-w-[95vw] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start">
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Organization
          </span>
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(["users", "baseGroups", "stores"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "users" && <Users />}
        {tab === "baseGroups" && <BaseGroups />}
        {tab === "stores" && <StoresDirectory />}
      </div>
    </div>
  );
};

export default Organization;
