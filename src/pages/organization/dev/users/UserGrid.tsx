import { useEffect, useMemo, useState } from "react";
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
import {
  getBaseGroupsAssignedToUser,
  getUserGroupPicks,
} from "../../../../api/team";
import type {
  BaseGroup,
  JsonError,
  Store,
  User,
  UserGroupPick,
} from "../../../../interfaces";
import { accessModeOf } from "./access/accessSets";
import { roles } from "../constants";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import IconButton from "../../../../components-dev/IconButton";
import Checkbox from "../../../../components-dev/Checkbox";
import SetActiveModal from "./SetActiveModal";
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
   * Who is ticked, by id. Kept across filter changes so narrowing the list
   * and widening it again does not lose a selection — but only what is
   * ticked AND on screen is ever acted on (`selectedShown`), so nobody a
   * filter hid can ride along into a deactivation they were never shown in.
   */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  /**
   * Picking people for a bulk deactivate (or reactivate), on purpose.
   *
   * The checkboxes only exist in this mode, and the mode is entered from a
   * button that names the action. A checkbox column with no heading said what
   * it was for only once something was ticked, so the grid read as if every
   * row could be ticked for some unstated reason. Starting from the action
   * means every box already means "this person".
   */
  const [selecting, setSelecting] = useState(false);
  /** The confirmation, open: who it names and which way. One modal for one
   *  row or fifty, so the single trash icon is as guarded as the bulk bar. */
  const [settingActive, setSettingActive] = useState<{
    users: User[];
    active: 0 | 1;
  } | null>(null);
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

  /** Nobody may tick themselves or anyone above them — the server refuses
   *  both, so the box is not offered rather than offered and then refused. */
  const selectable = (u: User) =>
    !isOutranked(u.user_level) && u.id !== ctx.userid;

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
      // Mixed and no-groups people match neither choice, only All: they are
      // not By group or By store, and the column says so.
      const accessCheck = !accessFilter
        ? true
        : accessFilter === "none"
          ? u.access_mode === null
          : u.access_mode === accessFilter;
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
        companyCheck &&
        levelCheck &&
        roleCheck &&
        accessCheck &&
        textCheck &&
        usernameCheck &&
        emailCheck
      );
    });
  }, [
    sourceUsers,
    companyFilter,
    levelFilter,
    roleFilter,
    accessFilter,
    searchText,
    usernameFilter,
    emailFilter,
  ]);

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

  const accessLabel = (mode: User["access_mode"]) =>
    mode === "all"
      ? "By group"
      : mode === "selected"
        ? "By store"
        : mode === "mixed"
          ? "Mixed"
          : mode === null
            ? "Not set"
            : "—";

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

  /**
   * Duplicate: read what the source actually holds, stash it for the wizard
   * to pre-fill, then open it. Role, level, access type and assignments copy;
   * identity (name, username, email, password) always stays blank.
   *
   * ### Read, not reconstructed
   *
   * This used to fetch every held group's whole roster — one call per group —
   * and cross-reference the source's stores against them to GUESS which group
   * each store came through. Then any store no roster explained was filed
   * under "the first group in that store's company". Both guesses could hand
   * the copy more than the source had: a store in two groups became two
   * picks, and a direct assignment became an invented group pick nobody ever
   * chose. And the access type was not copied at all, because guessing `all`
   * would over-grant.
   *
   * None of that is a guess any more. `base_groups_assigned_to_user_split`
   * carries each held group's mode, and `user_group_picks` says exactly which
   * stores were picked and through which group. Two calls, whatever the
   * number of groups.
   *
   * **Direct assignments do not copy.** A store no group explains was never
   * granted by this screen and cannot be granted by it either — it has no
   * group to travel in. That is a property of the source, not something a
   * duplicate should manufacture.
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
          onClick={onOpenCreate}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {/* Named for what it opens -- the form is titled "Add user", and so
              is the step in the board and the training (finding AI). */}
          Add user
        </button>
      </div>

      {/* While picking, from the first moment rather than the first tick: it
          says what the boxes are for before anyone has to guess. It sits
          between the filters and the grid so the count is read next to the
          rows it counts. */}
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
            {/* By group or by store, rolled up by the users list itself so the
                column costs no call per row. */}
            <div>Access</div>
            <div>Last visited</div>
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
                        {/* Deactivate, as it always was underneath — the old
                            label said Delete and its confirm said "can't be
                            undone", while the row it removed sat one filter
                            away under Inactive with a Reactivate button.
                            Hidden on your own row: the server refuses it. */}
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
              <div className="flex items-center justify-center py-8 text-[12px] text-content">
                No users found
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
