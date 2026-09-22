import { useEffect, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "./hooks";
import { useResizableBox } from "../../../hooks/useResizableBox";
import ResizeHandle from "../../../components-dev/ResizeHandle";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type {
  JsonError,
  User,
  UserLevelJsonResp,
} from "../../../interfaces";
import { getAllUsers } from "../../../api/user";
import { getUserLevels } from "../../../api/team";
import {
  setInactiveUsers,
  setRefresh as setUsersRefresh,
  setUserLevels,
  setUsers,
} from "../../../features/dev/devUsersSlice";
import { setUsersExportOpen } from "../../../features/dev/devOrganizationSlice";
import Users from "./users/Users";
import SharedGroups from "./sharedGroups/SharedGroups";
import { SHARED_GROUP_OWNER_LEVEL } from "./sharedGroups/hooks";
import BaseGroups from "./baseGroups/BaseGroups";
import StoresDirectory from "./stores/StoresDirectory";
import { UserGroupsPanel } from "../../groups/dev/Groups";

type Tab = "users" | "userGroups" | "sharedGroups" | "baseGroups" | "stores";

/**
 * The tabs, in order, and the lowest level that sees each. `null` is everyone.
 *
 * - Users: managers and up.
 * - User Groups: everyone — their own store groups plus any shared group they
 *   have (created or shared with them, read-only). The Store Groups page,
 *   moved in; its own menu entry is hidden in dev mode.
 * - Shared Groups: owners and up — every shared group in their companies, to
 *   create, share and manage. The router enforces the same level.
 * - Base Groups: owners and up. Access only.
 * - Stores: everyone, and only the stores they're assigned to.
 */
const TABS: { id: Tab; label: string; minLevel: number | null }[] = [
  { id: "users", label: "Users", minLevel: 5 },
  { id: "userGroups", label: "User Groups", minLevel: null },
  { id: "sharedGroups", label: "Shared Groups", minLevel: SHARED_GROUP_OWNER_LEVEL },
  { id: "baseGroups", label: "Base Groups", minLevel: 7 },
  { id: "stores", label: "Stores", minLevel: null },
];


const Organization = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const tabs = TABS.filter((t) => t.minLevel === null || ctx.userLevel >= t.minLevel);
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? "userGroups");
  const [storesExportOpen, setStoresExportOpen] = useState(false);
  const canSeeUsers = tabs.some((t) => t.id === "users");
  const { width, height, boxRef, handleProps } = useResizableBox({
    storageKey: "organization-panel-size",
    defaultWidth: 1080,
    defaultHeight: 640,
    minWidth: 700,
    maxWidth: 1600,
    minHeight: 450,
    maxHeight: 950,
  });

  // usersSlice is shared with the legacy Team page (no forked slice), so
  // switching Live -> Preview mounts this component with whatever
  // refresh/users state legacy last left behind — often refresh:false,
  // which would skip the fetch below entirely and show stale/legacy-shaped
  // data (e.g. missing inactive_users). Force a fresh fetch on every mount.
  useEffect(() => {
    if (canSeeUsers) ctx.dispatch(setUsersRefresh(true));
  }, []);


  // The users list only loads for people who get the Users tab.
  useEffect(() => {
    if (!ctx.refresh || !canSeeUsers) return;
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const companyIds = ctx.companies.map((c) => c.company);
          const scopeToOwnCompanies = (list: User[]) =>
            list.filter((u: User) => {
              const isDcrUser = u.companies.find(
                (c) => c.company === 5 && c.name === "DCR",
              );
              if (isDcrUser) return false;
              return u.companies.some((c) => companyIds.includes(c.company));
            });
          const isDcrUser = ctx.companies.find(
            (c) => c.company === 5 && c.name === "DCR",
          );
          // Inactive users seeded for testing carry an @example.com email —
          // strip those out so the Inactive list only shows real accounts.
          const realInactiveUsers = j.inactive_users.filter(
            (u: User) => !u.email?.toLowerCase().endsWith("@example.com"),
          );
          // in place to double check the api is working so we don't mess with live users
          // const realInactiveUsers = j.inactive_users;
          ctx.dispatch(
            setUsers(isDcrUser ? j.users : scopeToOwnCompanies(j.users)),
          );
          ctx.dispatch(
            setInactiveUsers(
              isDcrUser
                ? realInactiveUsers
                : scopeToOwnCompanies(realInactiveUsers),
            ),
          );
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

  // Desktop only: no tablet or phone layout (a tablet or phone that reaches
  // the page by address gets this one). The mobile layout for User Management
  // and groups is being reworked, so dev has none for now.

  const exportable = tab === "users" || tab === "stores";

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start"
        style={{ width, height }}
      >
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            User Management
          </span>
          <div className="flex-1" />
          {exportable && (
            <button
              onClick={() =>
                tab === "users"
                  ? ctx.dispatch(setUsersExportOpen(true))
                  : setStoresExportOpen(true)
              }
              title="Export CSV"
              className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>


        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {tab === "users" && canSeeUsers && <Users />}
          {tab === "userGroups" && <UserGroupsPanel />}
          {tab === "sharedGroups" && ctx.userLevel >= SHARED_GROUP_OWNER_LEVEL && (
            <SharedGroups />
          )}
          {tab === "baseGroups" && ctx.userLevel >= 7 && <BaseGroups />}
          {tab === "stores" && (
            <StoresDirectory
              exportOpen={storesExportOpen}
              onCloseExport={() => setStoresExportOpen(false)}
            />
          )}
        </div>

        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Organization;
