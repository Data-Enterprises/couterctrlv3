import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  KeyIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  setRefresh,
  setSelectedUserForm,
  setSelectedUserId,
  setSelectedUserInfo,
  setDuplicateSource,
} from "../../../../features/dev/devUsersSlice";
import {
  setUsersExportOpen,
  setUsersGridFilter,
} from "../../../../features/dev/devOrganizationSlice";
import { deleteUser, reactivateUser, getBaseGroupsAssignedToUser } from "../../../../api/team";
import { getUserStores } from "../../../../api/user";
import { getAllStoresInBaseGroup } from "../../../../api/baseGroups";
import type { BaseGroup, JsonError, Store, User } from "../../../../interfaces";
import { roles } from "../constants";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import IconButton from "../../../../components-dev/IconButton";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import SecurityTab from "./view/SecurityTab";
import UsersExportModal from "./UsersExportModal";
import ColFilter from "../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../components-dev/filters/colFilterStyles";

interface UserGridProps {
  onOpenCreate: () => void;
}

const NO_COMPANY_VALUE = "none";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

const UserGrid = ({ onOpenCreate }: UserGridProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  // The filter bar persists in organizationSlice (not local useState) so
  // switching to Create/Detail and back — or navigating away entirely —
  // doesn't wipe out selections the admin already made.
  const {
    companyFilter,
    statusFilter,
    levelFilter,
    roleFilter,
    searchText,
    usernameFilter,
    emailFilter,
  } = ctx.usersGridFilters;
  const setCompanyFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ companyFilter: v }));
  const setStatusFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ statusFilter: v }));
  const setLevelFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ levelFilter: v }));
  const setRoleFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ roleFilter: v }));
  const setSearchText = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ searchText: v }));
  const setUsernameFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ usernameFilter: v }));
  const setEmailFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ emailFilter: v }));
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [securityUser, setSecurityUser] = useState<User | null>(null);
  // Draft text for the Username/Email column-header filters — matches the
  // draft/applied split used by every other ColFilter consumer in the app
  // (e.g. AssociationItemsTable.tsx's draftDesc/appliedDesc): typing doesn't
  // filter live, only committing via ColFilter's Apply button does.
  const [draftUsernameFilter, setDraftUsernameFilter] = useState(usernameFilter);
  const [draftEmailFilter, setDraftEmailFilter] = useState(emailFilter);
  const showInactive = statusFilter === "inactive";

  // The Users tab's grid/create/detail sub-views aren't visible to
  // Organization.tsx's header, so a stale usersExportOpen flag left set from
  // a prior visit (e.g. header click while viewing Create/Detail) would
  // otherwise pop the modal open the instant this grid remounts.
  useEffect(() => {
    ctx.dispatch(setUsersExportOpen(false));
  }, []);

  const isOutranked = (lvl: number) => lvl > ctx.userLevel;

  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    ctx.userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const sourceUsers = showInactive ? ctx.inactiveUsers : ctx.users;

  const filtered = useMemo(() => {
    return sourceUsers.filter((u) => {
      const companyCheck =
        companyFilter === NO_COMPANY_VALUE
          ? u.companies.length === 0
          : companyFilter
            ? u.companies.some((c) => c.company === Number(companyFilter))
            : true;
      const levelCheck = levelFilter
        ? u.user_level === Number(levelFilter)
        : true;
      const roleCheck = roleFilter ? u.role === Number(roleFilter) : true;
      const lowerText = searchText.toLowerCase();
      const firstName = (u.first_name ?? "").toLowerCase();
      const lastName = (u.last_name ?? "").toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const textCheck =
        searchText.trim() === ""
          ? true
          : firstName.includes(lowerText) ||
            lastName.includes(lowerText) ||
            fullName.includes(lowerText);
      const usernameCheck = usernameFilter.trim()
        ? u.username.toLowerCase().includes(usernameFilter.trim().toLowerCase())
        : true;
      const emailCheck = emailFilter.trim()
        ? (u.email ?? "").toLowerCase().includes(emailFilter.trim().toLowerCase())
        : true;
      return (
        companyCheck && levelCheck && roleCheck && textCheck && usernameCheck && emailCheck
      );
    });
  }, [
    sourceUsers,
    companyFilter,
    levelFilter,
    roleFilter,
    searchText,
    usernameFilter,
    emailFilter,
  ]);

  const noCompanyCount = useMemo(
    () => sourceUsers.filter((u) => u.companies.length === 0).length,
    [sourceUsers],
  );

  /**
   * The companies actually present in this grid, with how many people are in
   * each.
   *
   * It used to list the viewer's own companies, which was wrong in both
   * directions once programmers could be handed any company: it offered
   * companies nobody in the list belongs to, and hid the ones that people in
   * the list DO belong to but the viewer does not. Either way an option could
   * filter to nothing, or a company sitting in front of you had no option.
   *
   * Reading them off the rows keeps every option matching at least one person,
   * for every level, and needs no second source to stay in step. A company
   * with nobody in it is absent — which is the same answer the filter would
   * have given.
   */
  const companyOptions = useMemo(() => {
    const counts = new Map<number, { name: string; count: number }>();
    sourceUsers.forEach((u) =>
      u.companies.forEach((c) => {
        const seen = counts.get(c.company);
        if (seen) seen.count += 1;
        else counts.set(c.company, { name: c.name, count: 1 });
      }),
    );
    return [
      { value: NO_COMPANY_VALUE, label: `No company (${noCompanyCount})` },
      ...Array.from(counts.entries())
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .map(([id, { name, count }]) => ({
          value: String(id),
          label: `${name} (${count})`,
        })),
    ];
  }, [sourceUsers, noCompanyCount]);

  const handleEdit = (u: User) => {
    ctx.dispatch(setSelectedUserId(u.id));
    ctx.dispatch(setSelectedUserInfo(u));
    ctx.dispatch(setSelectedUserForm("user_info"));
  };

  // Duplicate: fetch the source user's base groups + stores (not present on
  // the grid row itself), stash them for the create wizard to pre-fill, then
  // open it. Only role/level/company/base-group/store data copies — identity
  // fields (name/username/email/password) always stay blank.
  const handleDuplicate = async (u: User) => {
    try {
      const [bgResp, storesResp] = await Promise.all([
        getBaseGroupsAssignedToUser(ctx.url, ctx.token, u.id),
        getUserStores(ctx.url, ctx.token, u.id),
      ]);
      const bgJson = bgResp.data;
      const storesJson = storesResp.data;
      if (bgJson.error !== 0 || storesJson.error !== 0) {
        toast.error("Could not load this user's assignments to duplicate");
        return;
      }

      // `active` is the held half of the split, which is what a duplicate
      // copies. (This read `.active` all along and was right to; a previous
      // pass "fixed" it to `.groups` on the mistaken belief that this call
      // hits the unsplit endpoint. It does not.)
      const groups = ((bgJson.active ?? []) as BaseGroup[]).map((g) => ({
        id: g.id,
        name: g.name,
        company: g.company,
      }));
      const assignedStores: Store[] = storesJson.assigned_stores.filter(
        (s: Store) => s.store_name != null,
      );

      // A company can have more than one base group, so tagging a store by
      // "first group in the same company" silently merged every group's
      // stores into whichever group happened to match first — cross-
      // reference each group's own store roster against the source user's
      // assigned stores to find which group(s) each store actually belongs
      // to. A store can legitimately land under more than one group.
      const rosterResults = await Promise.all(
        groups.map((g) =>
          getAllStoresInBaseGroup(ctx.url, ctx.token, g.id).then((resp) => ({
            groupId: g.id,
            storeIds: new Set(
              (resp.data.assigned_stores as Store[]).map((s) => s.storeid),
            ),
          })),
        ),
      );

      const taggedStores: (Store & { base_group: number })[] = [];
      const taggedStoreIds = new Set<number>();
      assignedStores.forEach((store) => {
        const matches = rosterResults.filter((r) =>
          r.storeIds.has(store.storeid),
        );
        matches.forEach((m) =>
          taggedStores.push({ ...store, base_group: m.groupId }),
        );
        if (matches.length > 0) taggedStoreIds.add(store.storeid);
      });

      // A store assigned to the user directly (outside any of their groups)
      // has no group to nest under in this wizard's store-picker model —
      // fall back to the first group in that store's own company so it
      // still submits, rather than silently dropping it.
      assignedStores.forEach((store) => {
        if (taggedStoreIds.has(store.storeid)) return;
        const fallbackGroup = groups.find((g) => g.company === store.company);
        if (fallbackGroup) {
          taggedStores.push({ ...store, base_group: fallbackGroup.id });
        }
      });

      ctx.dispatch(
        setDuplicateSource({
          role: u.role ?? 0,
          user_level: u.user_level,
          companyIds: u.companies.map((c) => c.company),
          baseGroupIds: groups.map((g) => g.id),
          groups,
          stores: taggedStores,
        }),
      );
      onOpenCreate();
    } catch (err) {
      toast.error(
        "Error duplicating user's setup: " + (err as JsonError).message,
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(ctx.url, ctx.token, deletingUser.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User deleted successfully");
          setDeletingUser(null);
          ctx.dispatch(setRefresh(true));
        } else {
          toast.warn("Error deleting user: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error deleting user: " + err.message),
      );
  };

  const handleReactivate = (u: User) => {
    reactivateUser(ctx.url, ctx.token, u.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User reactivated successfully");
          ctx.dispatch(setRefresh(true));
        } else {
          toast.warn("Error reactivating user: " + j.msg);
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error reactivating user: " + err.message),
      );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      <div data-help="filters" className="flex flex-wrap items-center gap-2 mb-3">
        <SelectFilter
          options={companyOptions}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="All companies"
          className="w-[150px] flex-shrink-0"
        />
        <SelectFilter
          options={[
            { value: "inactive", label: `Inactive (${ctx.inactiveUsers.length})` },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Active"
          className="w-[110px] flex-shrink-0"
        />
        <SelectFilter
          options={ctx.userLevels.map((l) => ({
            value: String(l.id),
            label: l.name,
          }))}
          value={levelFilter}
          onChange={setLevelFilter}
          placeholder="All levels"
          className="w-[130px] flex-shrink-0"
        />
        <SelectFilter
          options={roles.map((r) => ({
            value: String(r.value),
            label: r.label,
          }))}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All roles"
          className="w-[120px] flex-shrink-0"
        />
        <TextFilter
          value={searchText}
          onChange={setSearchText}
          placeholder="Search name"
          className="flex-1 min-w-[100px]"
        />
        <button
          onClick={onOpenCreate}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {/* Named for what it opens -- the form is titled "Add user", and so
              is the step in the board and the training (finding AI). */}
          Add user
        </button>
      </div>

      {ctx.usersExportOpen && (
        <UsersExportModal
          onClose={() => ctx.dispatch(setUsersExportOpen(false))}
          allUsers={sourceUsers}
          filteredUsers={filtered}
          userLevels={ctx.userLevels}
          scopeLabel={showInactive ? "Inactive users" : "Active users"}
        />
      )}

      <div className="border border-gray-100 rounded-lg overflow-x-auto thin-scrollbar flex-1 min-h-0 flex flex-col">
        {/* min-w floors the columns: narrower than this the card scrolls
            rather than crushing cells into each other. Header and rows are
            separate grids, so they must share one scroller to stay aligned. */}
        <div className="min-w-[900px] flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-[12%_12%_12%_22%_11%_10%_11%_7rem] px-3 py-2 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-content flex-shrink-0">
            <ColFilter
              label="Username"
              active={!!usernameFilter}
              activeValue={usernameFilter}
              onApply={() => setUsernameFilter(draftUsernameFilter)}
              onClear={() => {
                setUsernameFilter("");
                setDraftUsernameFilter("");
              }}
            >
              <input
                autoFocus
                style={colInputStyle}
                placeholder="Search username…"
                value={draftUsernameFilter}
                onChange={(e) => setDraftUsernameFilter(e.target.value)}
              />
            </ColFilter>
            <div>First name</div>
            <div>Last name</div>
            <ColFilter
              label="Email"
              active={!!emailFilter}
              activeValue={emailFilter}
              onApply={() => setEmailFilter(draftEmailFilter)}
              onClear={() => {
                setEmailFilter("");
                setDraftEmailFilter("");
              }}
            >
              <input
                autoFocus
                style={colInputStyle}
                placeholder="Search email…"
                value={draftEmailFilter}
                onChange={(e) => setDraftEmailFilter(e.target.value)}
              />
            </ColFilter>
            <div>Role</div>
            <div>Level</div>
            <div>Last visited</div>
            <div></div>
          </div>
          <div data-help="grid" className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
            {filtered.map((u) => {
              const outranked = isOutranked(u.user_level);
              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[12%_12%_12%_22%_11%_10%_11%_7rem] px-3 py-2 text-[13px] items-center transition-colors [content-visibility:auto] [contain-intrinsic-size:0_40px] ${outranked ? "bg-gray-50 text-content/85" : "text-content even:bg-row_stripe hover:bg-gray-50"}`}
                >
                  <div className="truncate">{u.username}</div>
                  <div className="truncate">{u.first_name || "—"}</div>
                  <div className="truncate">{u.last_name || "—"}</div>
                  <div className="truncate">{u.email}</div>
                  <div className="truncate">{renderRoleText(u.role)}</div>
                  <div className="truncate">{renderLvlText(u.user_level)}</div>
                  <div className="truncate">{formatDate(u.last_visit)}</div>
                  <div className="flex items-center justify-end gap-1">
                    {outranked ? (
                      <span className="text-[10px] italic text-content/85">
                        Unauthorized
                      </span>
                    ) : showInactive ? (
                      <IconButton
                        icon={ArrowPathIcon}
                        title="Reactivate"
                        onClick={() => handleReactivate(u)}
                      />
                    ) : (
                      <>
                        <IconButton
                          icon={PencilIcon}
                          title="Edit"
                          onClick={() => handleEdit(u)}
                        />
                        <IconButton
                          icon={DocumentDuplicateIcon}
                          title="Duplicate"
                          onClick={() => handleDuplicate(u)}
                        />
                        <IconButton
                          icon={KeyIcon}
                          title="Password & security"
                          onClick={() => setSecurityUser(u)}
                        />
                        <IconButton
                          icon={TrashIcon}
                          title="Delete"
                          variant="danger"
                          onClick={() => setDeletingUser(u)}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-8 text-[12px] text-content">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>

      {deletingUser && (
        <ConfirmModal
          title={`Delete ${deletingUser.username}?`}
          message="This can't be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUser(null)}
        />
      )}

      {securityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-custom-white rounded-xl p-5 w-[480px] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-medium text-content">
                Password & security — {securityUser.username}
              </div>
              <button
                onClick={() => setSecurityUser(null)}
                className="text-[11px] text-content/85"
              >
                Close
              </button>
            </div>
            <SecurityTab user={securityUser} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGrid;
