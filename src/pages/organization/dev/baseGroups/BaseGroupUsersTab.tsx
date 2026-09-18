import { useEffect, useRef } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import {
  useOrganizationCtx,
  useRefreshUserGroups,
  useRefreshUserStores,
} from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getBaseGroupsAssignedToUser } from "../../../../api/team";
import { shareBgWithUsers, unshareBgWithUsers } from "../../../../api/assignments";
import {
  mergeBaseGroupUserStatus,
  setBaseGroupShareSummary,
  clearBaseGroupSelection,
  setBaseGroupSelectedUserIds,
  setBaseGroupUserStatus,
  setPendingBaseGroupAction,
} from "../../../../features/dev/devOrganizationSlice";
import type {
  BaseGroupJsonResp,
  CompanyBaseGroup,
  JsonError,
} from "../../../../interfaces";
import type { ShareBgResp, UnshareBgResp } from "../types";
import AssignPanel from "../components/AssignPanel";
import ConfirmModal from "../../../../components-dev/ConfirmModal";

interface Props {
  group: CompanyBaseGroup;
  // null while the store split is still loading — only a hard 0 means the
  // group really has no stores.
  assignedStoreCount: number | null;
}

// Assigning and unassigning both go through assignments/share_bg_with_users
// and its mirror, which run the whole chain per user in one transaction:
// company link, base group link, store grants, and a store group named after
// the base group. The older groups/assign_base_group_to_user wrote only the
// base group link, so a user assigned here used to end up holding the group
// and no stores at all.
//
// Reading is still one call per candidate: there's no "which users have this
// base group" endpoint, only the reverse, so each candidate's column is
// resolved with its own call to that per-user endpoint (the same one the
// profile's Base groups tab uses). A backend addition would collapse this.
const BaseGroupUsersTab = ({ group, assignedStoreCount }: Props) => {
  const ctx = useOrganizationCtx();
  const toast = useToast();
  const refreshUserGroups = useRefreshUserGroups();
  const refreshUserStores = useRefreshUserStores();

  // Sharing or unsharing the acting user builds or tears down one of their own
  // store groups, and grants or revokes their stores with it. groupSlice and
  // userSlice are otherwise only filled at login, so without this their own
  // picker stays wrong for the rest of the session.
  const refreshSelfIfIncluded = (ids: number[]) => {
    if (!ids.includes(ctx.userid)) return;
    refreshUserGroups();
    refreshUserStores();
  };

  const candidates = ctx.users.filter(
    (u) =>
      u.companies.some((c) => c.company === group.company) &&
      u.user_level <= ctx.userLevel,
  );

  // Tracks which group the in-flight lookups below belong to, so a response
  // that resolves after the user has already switched to a different group
  // doesn't get written into the new group's (just-reset) status map.
  const activeGroupId = useRef(group.id);

  const fetchStatus = (userid: number, forGroupId: number) => {
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, userid)
      .then((resp) => {
        if (activeGroupId.current !== forGroupId) return;
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          const has = j.active.some((bg) => bg.id === forGroupId);
          ctx.dispatch(mergeBaseGroupUserStatus({ [userid]: has }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  // Reset and fetch together in one effect — splitting the reset into its
  // own effect let the fetch effect's closure see stale (pre-reset) status
  // from the previous group and skip users who happened to share the same
  // id, permanently stalling their lookup.
  useEffect(() => {
    activeGroupId.current = group.id;
    ctx.dispatch(setBaseGroupUserStatus({}));
    ctx.dispatch(setBaseGroupShareSummary(null));
    ctx.dispatch(setPendingBaseGroupAction(null));
    ctx.dispatch(clearBaseGroupSelection());
    candidates.forEach((u) => fetchStatus(u.id, group.id));
  }, [group.id, candidates.map((u) => u.id).join(",")]);

  const statusByUser = ctx.baseGroupUserStatus;
  const resolvedCount = candidates.filter((u) => u.id in statusByUser).length;
  const pendingCount = candidates.length - resolvedCount;

  const sumBy = <T,>(rows: T[], pick: (row: T) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);

  // Shared by Assign and Sync: both are the same call, and the endpoint
  // reconciles rather than appends, so re-running it on someone already
  // assigned is what builds (or repairs) their store group.
  const runShare = (ids: number[], action: "share" | "sync") => {
    if (ids.length === 0) return;
    shareBgWithUsers(ctx.url, ctx.token, group.company, group.id, ids)
      .then((resp) => {
        const j: ShareBgResp = resp.data;
        if (j.error !== 0) {
          toast.error(
            j.msg ||
              (action === "sync"
                ? "Could not sync users"
                : "Could not assign users"),
          );
          return;
        }
        // The response names every user it touched, so the columns are moved
        // from it directly rather than re-resolving each candidate.
        const next: Record<number, boolean> = {};
        j.users.forEach((u) => {
          next[u.userid] = true;
        });
        ctx.dispatch(mergeBaseGroupUserStatus(next));
        ctx.dispatch(
          setBaseGroupShareSummary({
            action,
            userCount: j.user_count,
            storesGranted: sumBy(j.users, (u) => u.stores_added.length),
            storesRevoked: sumBy(j.users, (u) => u.stores_removed.length),
            storesKept: 0,
            storeGroupsReused: j.users.filter((u) => u.store_group_reused)
              .length,
          }),
        );
        // The selection has been consumed, so drop it here as well as in the
        // panel — leaving rows highlighted after a sync reads as still staged.
        if (action === "sync") ctx.dispatch(clearBaseGroupSelection());
        refreshSelfIfIncluded(ids);
        toast.success(action === "sync" ? "Users synced" : "User(s) assigned");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassign = (ids: number[]) => {
    unshareBgWithUsers(ctx.url, ctx.token, group.company, group.id, ids)
      .then((resp) => {
        const j: UnshareBgResp = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not unassign users");
          return;
        }
        const next: Record<number, boolean> = {};
        j.users.forEach((u) => {
          next[u.userid] = false;
        });
        ctx.dispatch(mergeBaseGroupUserStatus(next));
        ctx.dispatch(
          setBaseGroupShareSummary({
            action: "unshare",
            userCount: j.user_count,
            storesGranted: 0,
            storesRevoked: sumBy(j.users, (u) => u.stores_revoked.length),
            storesKept: sumBy(j.users, (u) => u.stores_kept.length),
            storeGroupsReused: 0,
          }),
        );
        refreshSelfIfIncluded(ids);
        toast.success("User(s) unassigned");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const unassigned = candidates.filter((u) => statusByUser[u.id] === false);
  const assigned = candidates.filter((u) => statusByUser[u.id] === true);

  const summary = ctx.baseGroupShareSummary;
  const pending = ctx.pendingBaseGroupAction;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  // Sync targets the right column's selection when there is one, and every
  // assigned user otherwise. Filtered against `assigned` because a selection
  // made before a share/unshare can name someone who has since moved columns.
  const selectedAssigned = assigned
    .map((u) => u.id)
    .filter((id) => ctx.baseGroupSelectedUserIds.includes(id));
  const syncIds =
    selectedAssigned.length > 0 ? selectedAssigned : assigned.map((u) => u.id);

  const runPending = () => {
    if (!pending) return;
    const { kind, userids } = pending;
    ctx.dispatch(setPendingBaseGroupAction(null));
    if (kind === "unshare") handleUnassign(userids);
    else runShare(userids, "sync");
  };

  return (
    <div className="w-full">
      {assignedStoreCount === 0 && (
        <div className="text-[11px] text-content bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mb-2">
          This group has no stores yet. Sharing it now assigns the group but
          grants nothing — and adding stores later won't reach these users until
          you assign them again.
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        {pendingCount > 0 && (
          <div className="text-[10.5px] text-content/85">
            Resolving {pendingCount} more user{pendingCount === 1 ? "" : "s"}…
          </div>
        )}
        <div className="flex-1" />
        {/* Users assigned before these endpoints existed hold only a base
            group link — no store group was ever built for them, and the
            Assign path never fires for someone already in the right column.
            This re-runs the share over the current members to backfill it. */}
        <button
          onClick={() =>
            ctx.dispatch(
              setPendingBaseGroupAction({
                kind: "sync",
                userids: syncIds,
              }),
            )
          }
          disabled={syncIds.length === 0}
          title="Rebuild store groups and store access — for the users selected on the right, or everyone assigned if none are selected"
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border border-gray-200 text-content hover:bg-gray-50 disabled:text-content/75 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className="w-3 h-3" />
          Sync{" "}
          {selectedAssigned.length > 0
            ? plural(selectedAssigned.length, "selected user")
            : plural(assigned.length, "assigned user")}
        </button>
      </div>
      {summary && (
        <div className="text-[11px] text-content border-l-2 border-[#1e2a4a] pl-2 mb-2">
          {summary.action === "unshare"
            ? `${plural(summary.userCount, "user")} unassigned · ${plural(summary.storesRevoked, "store")} revoked`
            : `${plural(summary.userCount, "user")} ${summary.action === "sync" ? "synced" : "assigned"} · ${plural(summary.storesGranted, "store")} granted`}
          {summary.action !== "unshare" && summary.storesRevoked > 0 && (
            <>
              {" · "}
              {plural(summary.storesRevoked, "store")} revoked to match this
              group
            </>
          )}
          {summary.action === "unshare" && summary.storesKept > 0 && (
            <>
              {" · "}
              {plural(summary.storesKept, "store")} kept via another base group
            </>
          )}
          {summary.storeGroupsReused > 0 && (
            <>
              {" · "}
              {plural(summary.storeGroupsReused, "existing store group")} reused
            </>
          )}
        </div>
      )}
      <AssignPanel
        leftTitle="Unassigned"
        rightTitle="Assigned"
        leftItems={unassigned.map((u) => ({
          id: u.id,
          label: u.username,
          sublabel: u.email,
        }))}
        rightItems={assigned.map((u) => ({
          id: u.id,
          label: u.username,
          sublabel: u.email,
        }))}
        onRightSelectionChange={(ids) =>
          ctx.dispatch(setBaseGroupSelectedUserIds(ids))
        }
        rightSelectionResetKey={ctx.baseGroupSelectionResetKey}
        onAssign={(ids) => runShare(ids, "share")}
        // Staged rather than sent: an unshare deletes each user's store group
        // outright and revokes any store no other base group of theirs grants,
        // so it gets a confirm the way deleting the group itself does.
        onUnassign={(ids) =>
          ids.length > 0 &&
          ctx.dispatch(
            setPendingBaseGroupAction({ kind: "unshare", userids: ids }),
          )
        }
      />

      {pending && pending.userids.length > 0 && (
        <ConfirmModal
          title={
            pending.kind === "unshare"
              ? `Remove ${plural(pending.userids.length, "user")} from ${group.name}?`
              : `Sync ${plural(pending.userids.length, "user")}?`
          }
          message={
            pending.kind === "unshare"
              ? `This deletes each user's "${group.name}" store group and revokes any store no other base group of theirs grants. Stores they can still reach another way are kept.`
              : `This grants every store in ${group.name} to ${selectedAssigned.length > 0 ? "the selected users" : "the users already assigned to it"}, and creates or updates their "${group.name}" store group. Anyone currently holding only some of the group's stores will end up with all of them.`
          }
          confirmLabel={
            pending.kind === "unshare" ? "Yes, remove" : "Yes, sync"
          }
          onConfirm={runPending}
          onCancel={() => ctx.dispatch(setPendingBaseGroupAction(null))}
        />
      )}
    </div>
  );
};

export default BaseGroupUsersTab;
