// Hooks
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useOrganizationCtx } from "../../hooks";

// Redux
import {
  setRefresh,
  setSelectedUserForm,
  setSelectedUserId,
  setSelectedUserInfo,
  setDuplicateSource,
  clearDuplicateSource,
} from "../../../../../features/dev/devUsersSlice";
import {
  setUsersGridFilter,
} from "../../../../../features/dev/devOrganizationSlice";

// API
import {
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../../api/team";

// Utils
import { accessLabel, filterUsers, NO_COMPANY_VALUE, sortUsers } from "../../utils/userFilters";
import { accessModeOf, formatDate } from "../utils";
import { roles } from "../utils/roles";

// Interfaces
import type { UserSort, UserSortKey } from "../../interfaces";
import type {
  BaseGroup,
  JsonError,
  Store,
  User,
  UserGroupPick,
} from "../../../../../interfaces";

// Components
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  KeyIcon,
  DocumentDuplicateIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@heroicons/react/20/solid";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import IconButton from "../../../../../components-dev/IconButton";
import Checkbox from "../../../../../components-dev/Checkbox";
import ColFilter from "../../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../../components-dev/filters/colFilterStyles";
import SetActiveModal from "./SetActiveModal";
import SecurityTab from "./SecurityTab";

interface UserGridProps {
  onOpenCreate: () => void;
}

const UserGrid = ({ onOpenCreate }: UserGridProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  // The filter bar persists in organizationSlice, so leaving for Add/Edit (or
  // the page) and coming back keeps the admin's selections.
  const {
    companyFilter,
    statusFilter,
    levelFilter,
    roleFilter,
    accessFilter,
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
  const setAccessFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ accessFilter: v }));
  const setSearchText = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ searchText: v }));
  const setUsernameFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ usernameFilter: v }));
  const setEmailFilter = (v: string) =>
    ctx.dispatch(setUsersGridFilter({ emailFilter: v }));
  /**
   * Who is ticked, by id, kept across filter changes. Only ticked AND shown
   * (`selectedShown`) is acted on, so nobody hidden by a filter rides along.
   */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  /**
   * Picking people for a bulk deactivate or reactivate. The checkboxes exist
   * only in this mode, entered from a button that names the action.
   */
  const [selecting, setSelecting] = useState(false);
  /** The confirmation, open: who it names and which way. One modal for one
   *  row or fifty, so the single trash icon is as guarded as the bulk bar. */
  const [settingActive, setSettingActive] = useState<{
    users: User[];
    active: 0 | 1;
  } | null>(null);
  const [securityUser, setSecurityUser] = useState<User | null>(null);
  // Draft text for the Username/Email header filters: typing doesn't filter
  // live, only ColFilter's Apply does.
  const [draftUsernameFilter, setDraftUsernameFilter] = useState(usernameFilter);
  const [draftEmailFilter, setDraftEmailFilter] = useState(emailFilter);
  const showInactive = statusFilter === "inactive";

  const isOutranked = (lvl: number) => lvl > ctx.userLevel;

  /** Nobody may tick themselves or anyone above them — the server refuses
   *  both, so the box is not offered rather than offered and then refused. */
  const selectable = (u: User) =>
    !isOutranked(u.user_level) && u.id !== ctx.userid;

  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    ctx.userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const sourceUsers = showInactive ? ctx.inactiveUsers : ctx.users;

  /** A click sorts by a column, a second click turns it round, a third goes
   *  back to the order the list arrived in. */
  const [sort, setSort] = useState<UserSort | null>(null);
  const toggleSort = (key: UserSortKey) =>
    setSort((prev) =>
      prev?.key !== key ? { key, desc: false } : prev.desc ? null : { key, desc: true },
    );
  const SortHead = ({ label, k }: { label: string; k: UserSortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      aria-label={`Sort by ${label.toLowerCase()}`}
      className="flex items-center gap-1 text-left uppercase tracking-wide font-semibold hover:text-brand_navy"
    >
      {label}
      {sort?.key === k && <span aria-hidden="true">{sort.desc ? "↓" : "↑"}</span>}
    </button>
  );

  const filtered = useMemo(
    () =>
      sortUsers(filterUsers(sourceUsers, ctx.usersGridFilters), sort, renderRoleText),
    [sourceUsers, ctx.usersGridFilters, sort],
  );

  // Active and inactive are different lists with opposite actions. A
  // selection made in one means nothing in the other.
  useEffect(() => {
    setSelected(new Set());
    setSelecting(false);
  }, [showInactive]);

  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  // Escape backs out of picking, as it closes everything else in the app.
  // Not while the confirmation is up: its own Escape belongs to it.
  useEffect(() => {
    if (!selecting || settingActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopSelecting();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selecting, settingActive]);

  const selectedShown = useMemo(
    () => filtered.filter((u) => selected.has(u.id) && selectable(u)),
    // `selectable` reads only the viewer's id and level.
    [filtered, selected, ctx.userid, ctx.userLevel],
  );
  const selectableShown = useMemo(
    () => filtered.filter(selectable),
    [filtered, ctx.userid, ctx.userLevel],
  );
  const allShownSelected =
    selectableShown.length > 0 &&
    selectableShown.every((u) => selected.has(u.id));

  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** "Select all shown": every selectable row on screen, or none of them.
   *  Rows a filter hides keep whatever state they had. */
  const toggleAllShown = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allShownSelected) selectableShown.forEach((u) => next.delete(u.id));
      else selectableShown.forEach((u) => next.add(u.id));
      return next;
    });


  const noCompanyCount = useMemo(
    () => sourceUsers.filter((u) => u.companies.length === 0).length,
    [sourceUsers],
  );

  /**
   * The companies present in this grid, with how many people are in each, so
   * every option matches at least one person.
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

  /**
   * Duplicate: read what the source holds, stash it for the wizard to pre-fill,
   * then open it. Role, level, access type and assignments copy; identity
   * (name, username, email, password) stays blank.
   *
   * Read, not guessed: `base_groups_assigned_to_user_split` gives each held
   * group's mode and `user_group_picks` the exact stores per group.
   * **Direct assignments do not copy**: no group carries them.
   */
  const handleDuplicate = async (u: User) => {
    try {
      const [bgResp, picksResp] = await Promise.all([
        getBaseGroupsAssignedToUser(ctx.url, ctx.token, u.id),
        getUserGroupPicks(ctx.url, ctx.token, u.id),
      ]);
      const bgJson = bgResp.data;
      const picksJson = picksResp.data;
      if (bgJson.error !== 0 || picksJson.error !== 0) {
        toast.error("Could not load this user's assignments to duplicate");
        return;
      }

      // `active` is the held half of the split, which is what a duplicate
      // copies.
      const held = (bgJson.active ?? []) as BaseGroup[];
      const groups = held.map((g) => ({
        id: g.id,
        name: g.name,
        company: g.company,
      }));
      const byId = new Map(held.map((g) => [g.id, g]));
      const mode = accessModeOf(held);

      // Picks only mean anything By store. A By group source has none, and
      // its absence is the answer rather than a gap.
      const stores: (Store & { base_group: number })[] =
        mode === "all"
          ? []
          : ((picksJson.data ?? []) as UserGroupPick[])
              .filter((p) => byId.has(p.groupid))
              .map((p) => {
                const g = byId.get(p.groupid)!;
                return {
                  storeid: p.storeid,
                  store_number: p.store_number ?? "",
                  store_name: p.store_name ?? "",
                  company: g.company,
                  company_name: g.company_name,
                  base_group: p.groupid,
                };
              });

      ctx.dispatch(
        setDuplicateSource({
          role: u.role ?? 0,
          user_level: u.user_level,
          companyIds: u.companies.map((c) => c.company),
          baseGroupIds: groups.map((g) => g.id),
          groups,
          mode,
          stores,
        }),
      );
      onOpenCreate();
    } catch (err) {
      toast.error(
        "Error duplicating user's setup: " + (err as JsonError).message,
      );
    }
  };

  const closeSetActive = (changed: boolean) => {
    setSettingActive(null);
    if (!changed) return;
    // Whoever moved is now in the other list; the selection named them in
    // this one. Picking is over, too: the job it was opened for is done.
    stopSelecting();
    ctx.dispatch(setRefresh(true));
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
        <SelectFilter
          options={[
            { value: "all", label: "By group" },
            { value: "selected", label: "By store" },
            // Made in prod, or before access types existed. Edit sets it.
            { value: "none", label: "Not set" },
          ]}
          value={accessFilter}
          onChange={setAccessFilter}
          placeholder="All access"
          className="w-[120px] flex-shrink-0"
        />
        <TextFilter
          value={searchText}
          onChange={setSearchText}
          placeholder="Search name"
          className="flex-1 min-w-[100px]"
        />
        {/* The way into picking, named for what picking is for. Gone while
            picking: the bar below takes over and says the same thing. */}
        {!selecting && (
          <button
            onClick={() => {
              setSelected(new Set());
              setSelecting(true);
            }}
            className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md border border-brand_line_2 text-content hover:border-brand_slate flex-shrink-0"
          >
            {showInactive ? (
              <UserPlusIcon className="w-3.5 h-3.5" />
            ) : (
              <UserMinusIcon className="w-3.5 h-3.5" />
            )}
            {showInactive ? "Reactivate users" : "Deactivate users"}
          </button>
        )}
        <button
          onClick={() => {
            // Add user is a blank form; only Duplicate fills one in.
            ctx.dispatch(clearDuplicateSource());
            onOpenCreate();
          }}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {/* Named for what it opens -- the form is titled "Add user", and so
              is the step in the board and the training (finding AI). */}
          Add user
        </button>
      </div>

      {/* Shown from the moment picking starts, between the filters and the
          grid, so the count sits next to the rows it counts. */}
      {selecting && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 px-3 py-2 rounded-lg bg-filter_active border border-filter_active_border">
          <span className="text-[12.5px] font-semibold text-brand_navy">
            {showInactive ? "Choose who to reactivate" : "Choose who to deactivate"}
          </span>
          <span className="text-[12px] tabular-nums text-content/95">
            {selectedShown.length} of {selectableShown.length} picked
          </span>
          {selectableShown.length > 0 && (
            <button
              onClick={toggleAllShown}
              className="text-[11.5px] font-semibold text-brand_navy underline underline-offset-2"
            >
              {allShownSelected
                ? "Clear selection"
                : `Select all ${selectableShown.length} shown`}
            </button>
          )}
          <span className="flex-1" />
          <button
            onClick={stopSelecting}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-brand_line_2 bg-custom-white text-content hover:border-brand_slate"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              setSettingActive({
                users: selectedShown,
                active: showInactive ? 1 : 0,
              })
            }
            disabled={selectedShown.length === 0}
            className={`text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white disabled:cursor-not-allowed disabled:opacity-40 ${
              showInactive
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-red-600 hover:bg-red-600/85"
            }`}
          >
            {showInactive ? "Reactivate" : "Deactivate"} {selectedShown.length}
          </button>
        </div>
      )}

      <div className="border border-gray-100 rounded-lg overflow-x-auto thin-scrollbar flex-1 min-h-0 flex flex-col">
        {/* min-w floors the columns (narrower scrolls). Header and rows are
            separate grids, so they share one scroller to stay aligned. */}
        <div className="min-w-[1000px] flex-1 min-h-0 flex flex-col">
          <div
            className={`grid ${
              selecting
                ? "grid-cols-[2rem_11%_10%_10%_19%_10%_9%_8%_9%_7rem]"
                : "grid-cols-[11%_10%_10%_19%_10%_9%_8%_9%_7rem]"
            } px-3 py-2 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-content flex-shrink-0 items-center`}
          >
            {/* Select all lives in the bar, where it says so in words. */}
            {selecting && <div />}
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
            <SortHead label="First name" k="first" />
            <SortHead label="Last name" k="last" />
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
            <SortHead label="Role" k="role" />
            <SortHead label="Level" k="level" />
            {/* By group or by store, rolled up by the users list itself so the
                column costs no call per row. */}
            <SortHead label="Access" k="access" />
            <SortHead label="Last visited" k="visited" />
            <div></div>
          </div>
          <div data-help="grid" className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
            {filtered.map((u) => {
              const outranked = isOutranked(u.user_level);
              // While picking, the whole row is the target, not just the box.
              const pickable = selecting && selectable(u);
              const picked = pickable && selected.has(u.id);
              return (
                <div
                  key={u.id}
                  onClick={pickable ? () => toggleOne(u.id) : undefined}
                  className={`grid ${
                    selecting
                      ? "grid-cols-[2rem_11%_10%_10%_19%_10%_9%_8%_9%_7rem] border-l-2"
                      : "grid-cols-[11%_10%_10%_19%_10%_9%_8%_9%_7rem]"
                  } px-3 py-2 text-[13px] items-center transition-colors [content-visibility:auto] [contain-intrinsic-size:0_40px] ${
                    picked
                      ? "bg-row_selected border-l-row_selected_border text-content"
                      : outranked
                        ? "bg-gray-50 text-content/85 border-l-transparent"
                        : "text-content even:bg-row_stripe hover:bg-gray-50 border-l-transparent"
                  } ${pickable ? "cursor-pointer" : ""}`}
                >
                  {selecting && (
                    // The box toggles through the row's own click, so its
                    // change must not reach the row as a second one.
                    <div
                      className="flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {pickable && (
                        <Checkbox
                          checked={picked}
                          onChange={() => toggleOne(u.id)}
                          ariaLabel={`Select ${u.username}`}
                        />
                      )}
                    </div>
                  )}
                  <div className="truncate">{u.username}</div>
                  <div className="truncate">{u.first_name || "—"}</div>
                  <div className="truncate">{u.last_name || "—"}</div>
                  <div className="truncate">{u.email}</div>
                  <div className="truncate">{renderRoleText(u.role)}</div>
                  <div className="truncate">{renderLvlText(u.user_level)}</div>
                  <div
                    className="truncate"
                    title={
                      u.access_mode === "mixed"
                        ? "Their base groups disagree — some by group, some by store. Editing them and saving sets one access type."
                        : undefined
                    }
                  >
                    {accessLabel(u.access_mode)}
                  </div>
                  <div className="truncate">{formatDate(u.last_visit)}</div>
                  <div className="flex items-center justify-end gap-1">
                    {/* While picking, a click on a row only ticks it: nothing
                        here that would open or change somebody instead. */}
                    {selecting ? null : outranked ? (
                      <span className="text-[10px] italic text-content/85">
                        Unauthorized
                      </span>
                    ) : showInactive ? (
                      <IconButton
                        icon={ArrowPathIcon}
                        title="Reactivate"
                        onClick={() =>
                          setSettingActive({ users: [u], active: 1 })
                        }
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
                        {/* Deactivate (reversible from Inactive). Hidden on
                            your own row: the server refuses it. */}
                        {u.id !== ctx.userid && (
                          <IconButton
                            icon={TrashIcon}
                            title="Deactivate"
                            variant="danger"
                            onClick={() =>
                              setSettingActive({ users: [u], active: 0 })
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex items-center justify-center gap-3 py-8 text-[12px] text-content">
                {ctx.usersError ? (
                  <>
                    <span>{ctx.usersError}</span>
                    <button
                      onClick={() => ctx.dispatch(setRefresh(true))}
                      className="text-[12px] font-medium px-3 py-1 rounded-md bg-brand_navy text-custom-white hover:bg-brand_navy/85"
                    >
                      Retry
                    </button>
                  </>
                ) : ctx.usersLoading ? (
                  "Loading users…"
                ) : (
                  "No users found"
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {settingActive && (
        <SetActiveModal
          users={settingActive.users}
          active={settingActive.active}
          onClose={closeSetActive}
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
