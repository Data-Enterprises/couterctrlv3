// Hooks
import { useEffect, useState } from "react";
import { useOrganizationCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

// Redux
import {
  setAllCompanies,
  setInactiveUsers,
  setRefresh as setUsersRefresh,
  setUserLevels,
  setUsers,
  setUsersLoad,
} from "../../../features/dev/devUsersSlice";
import {
  setUnsavedWizard,
  setUsersExportOpen,
} from "../../../features/dev/devOrganizationSlice";

// API
import { getAllUsers } from "../../../api/user";
import { getUserLevels } from "../../../api/team";
import { getCompanies } from "../../../api/company";

// Utils
import { PanelFitContext } from "./utils/panelFit";
import {
  filterUsers,
  filtersApplied,
  showsInactive,
} from "./utils/userFilters";
import { OWNER_LEVEL, TAB_FIT, TABS } from "./utils";

// Interfaces
import type { Tab, PanelFit } from "./interfaces";
import type {
  CompanyJsonResp,
  JsonError,
  User,
  UserLevelJsonResp,
} from "../../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import PageInfoButton from "../../../components-dev/PageInfoButton";
import ConfirmModal from "../../../components-dev/ConfirmModal";
import UsersExportModal from "./components/UsersExportModal";
import Users from "./users/Users";
import BaseGroups from "./baseGroups/BaseGroups";
import Companies from "./companies/Companies";
import StoresTab from "./stores/StoresTab";

/** The User Management page: a resizable box with tabs for Users, Companies, Base Groups and Stores, the
 *  Export CSV button, and a discard prompt when switching tabs with unsaved changes. Accounts with no
 *  tab to show see a "no access" notice. */
const Organization = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const tabs = TABS.filter((t) => t.minLevel === null || ctx.userLevel >= t.minLevel);
  const [tab, setTab] = useState<Tab>(tabs[0]?.id ?? "users");
  const [storesExportOpen, setStoresExportOpen] = useState(false);
  /** A tab asked for while Add or Edit has unsaved changes. */
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const chooseTab = (next: Tab) => {
    if (next === tab) return;
    if (ctx.unsavedWizard) setPendingTab(next);
    else setTab(next);
  };
  /**
   * The size the open view asks for; each view has one that fits it.
   */
  const [fit, setFit] = useState<PanelFit | null>(null);
  const canSeeUsers = tabs.some((t) => t.id === "users");

  // usersSlice is shared with the legacy Team page, which can leave
  // refresh:false behind and skip the fetch; so fetch fresh on every mount.
  useEffect(() => {
    if (canSeeUsers) ctx.dispatch(setUsersRefresh(true));
    // An export window left open on a previous visit stays shut until asked.
    ctx.dispatch(setUsersExportOpen(false));
  }, []);

  // The users list only loads for people who get the Users tab.
  useEffect(() => {
    if (!ctx.refresh || !canSeeUsers) return;
    ctx.dispatch(setUsersLoad(null));
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          ctx.dispatch(setUsersLoad(j.msg || "The users could not be read."));
          return;
        }
        ctx.dispatch(setUsersLoad(""));
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
      })
      .catch((err: JsonError) => {
        ctx.dispatch(setUsersLoad("The users could not be read: " + err.message));
        toast.error("Error fetching users " + err.message);
      });
    getUserLevels(ctx.url, ctx.token)
      .then((resp) => {
        const j: UserLevelJsonResp = resp.data;
        if (j.error === 0) ctx.dispatch(setUserLevels(j.levels));
      })
      .catch((err: JsonError) => toast.error(err.message));
    // Only programmers fetch every company: they assign ones they don't hold.
    // Everyone else is offered the companies on their own account.
    if (ctx.isProgrammer) {
      getCompanies(ctx.url, ctx.token)
        .then((resp) => {
          const j: CompanyJsonResp = resp.data;
          if (j.error === 0) ctx.dispatch(setAllCompanies(j.companies));
        })
        .catch((err: JsonError) =>
          toast.error("Error fetching companies " + err.message),
        );
    }
    ctx.dispatch(setUsersRefresh(false));
  }, [ctx.refresh]);

  // Desktop only: dev has no tablet or phone layout for User Management yet.

  const exportable = tab === "users" || tab === "stores";

  /**
   * The users export lives here, not in the grid: the grid isn't mounted while
   * Add or Edit is open. Same list and filters as the grid, from the slice.
   */
  const exportInactive = showsInactive(ctx.usersGridFilters);
  const exportSource = exportInactive ? ctx.inactiveUsers : ctx.users;

  /** What the open view asked for, else what the tab is worth. */
  const size = fit ?? TAB_FIT[tab];

  // No tab to show for this level.
  if (tabs.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 flex justify-center">
        <div className="self-start bg-custom-white rounded-xl shadow-lg px-6 py-5 text-[13px] text-content">
          You don’t have access to User Management.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] cc-panel shadow-lg self-start transition-[width,height] duration-200 ease-out motion-reduce:transition-none"
        style={{
          width: size.width,
          // Auto lets the card end where the form ends. max-h still caps it,
          // so a long form scrolls inside rather than running off the page.
          height: size.height === "auto" ? undefined : size.height,
        }}
      >
        <div className="bg-brand_navy px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="cc-navy-title text-[13px] flex-shrink-0">
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
              data-help="export"
              className="w-[20px] h-[20px] flex items-center justify-center rounded border border-custom-white/20 cc-navy-link hover:border-custom-white/40 flex-shrink-0"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <PageInfoButton page="user-management" title="About this page" />
        </div>

        <div data-help="tabs" className="flex border-b border-line_hair flex-shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => chooseTab(t.id)}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-brand_navy text-brand_navy"
                  : "border-transparent text-content"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {pendingTab && ctx.unsavedWizard && (
          <ConfirmModal
            title="Discard changes?"
            message={`Discard your changes to ${ctx.unsavedWizard}? Nothing has been saved.`}
            confirmLabel="Discard"
            onConfirm={() => {
              ctx.dispatch(setUnsavedWizard(null));
              setTab(pendingTab);
              setPendingTab(null);
            }}
            onCancel={() => setPendingTab(null)}
          />
        )}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <PanelFitContext.Provider value={setFit}>
          {tab === "users" && canSeeUsers && <Users />}
          {tab === "users" && canSeeUsers && ctx.usersExportOpen && (
            <UsersExportModal
              onClose={() => ctx.dispatch(setUsersExportOpen(false))}
              allUsers={exportSource}
              filteredUsers={filterUsers(exportSource, ctx.usersGridFilters)}
              userLevels={ctx.userLevels}
              scopeLabel={exportInactive ? "Inactive users" : "Active users"}
              filtersActive={filtersApplied(ctx.usersGridFilters)}
            />
          )}
          {tab === "companies" && ctx.userLevel >= OWNER_LEVEL && <Companies />}
          {tab === "baseGroups" && ctx.userLevel >= OWNER_LEVEL && <BaseGroups />}
          {tab === "stores" && ctx.userLevel >= OWNER_LEVEL && (
            <StoresTab
              exportOpen={storesExportOpen}
              onCloseExport={() => setStoresExportOpen(false)}
            />
          )}
          </PanelFitContext.Provider>
        </div>

      </div>
    </div>
  );
};

export default Organization;
