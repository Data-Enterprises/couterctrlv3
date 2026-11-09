// Hooks
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useBaseGroupsCtx } from "../../hooks";
import { useMarkUsersStale } from "../../utils/usersStale";

// API
import {
  updateBaseGroup,
  deleteBaseGroup,
  assignStoreToBaseGroups,
  unassignStoreFromBaseGroup,
} from "../../../../../api/baseGroups";

// Utils
import { groupStoresConfirm } from "../../utils/bulkConfirm";
import { callReason, summarizeAssign, summarizeUnassign } from "../utils";

// Interfaces
import type { StoreSplit, StoreOutcome } from "../interfaces";
import type { CompanyBaseGroup, JsonError, User } from "../../../../../interfaces";

// Components
import {
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import AssignPanel from "../../../../../components-dev/AssignPanel";
import IconButton from "../../../../../components-dev/IconButton";
import ConfirmModal from "../../../../../components-dev/ConfirmModal";
import BaseGroupUsersTab from "./BaseGroupUsersTab";
import BaseGroupExportModal from "./BaseGroupExportModal";

interface BaseGroupDetailProps {
  group: CompanyBaseGroup;
  companyName: string;
  stores: StoreSplit | undefined;
  users: User[];
  onRefetchStores: () => void;
  onDeleted: () => void;
  onRenamed: (newName: string) => void;
}

const BaseGroupDetail = ({
  group,
  companyName,
  stores,
  users,
  onRefetchStores,
  onDeleted,
  onRenamed,
}: BaseGroupDetailProps) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const markUsersStale = useMarkUsersStale();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [subTab, setSubTab] = useState<"stores" | "users">("stores");

  // Another group opened: start it fresh. A rename is the same group, so it
  // keeps its sub-tab.
  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
    setSubTab("stores");
    setExportOpen(false);
  }, [group.id]);
  useEffect(() => {
    setNameDraft(group.name);
  }, [group.name]);

  /** Escape: leave the name as it was. Read by the blur that follows. */
  const cancelRename = useRef(false);
  /** A rename on its way, so a second trigger doesn't send it again. */
  const renaming = useRef(false);
  /** A delete on its way, so a double-click on Confirm deletes once. */
  const deleting = useRef(false);

  const handleSave = () => {
    if (cancelRename.current) {
      cancelRename.current = false;
      setNameDraft(group.name);
      setEditing(false);
      return;
    }
    if (renaming.current) return;
    if (nameDraft.trim() === group.name.trim()) {
      setEditing(false);
      return;
    }
    if (!nameDraft.trim()) {
      toast.error("Group name is required");
      return;
    }
    renaming.current = true;
    updateBaseGroup(ctx.url, ctx.token, group.id, nameDraft, group.company)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group updated");
          setEditing(false);
          onRenamed(nameDraft.trim());
        } else {
          toast.error(j.msg || "Could not update base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => {
        renaming.current = false;
      });
  };

  const handleDelete = () => {
    if (deleting.current) return;
    deleting.current = true;
    setConfirmDelete(false);
    deleteBaseGroup(ctx.url, ctx.token, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group deleted");
          markUsersStale();
          onDeleted();
        } else {
          toast.error(j.msg || "Could not delete base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => {
        deleting.current = false;
      });
  };

  const [moving, setMoving] = useState(false);

  /**
   * Move a selection in or out, one store per call. The `groups/` endpoints
   * also hand the store to (or take it back from) everyone holding the group.
   * `allSettled`, so one refusal can't hide the moves that worked; then refetch.
   */
  const moveStores = async (
    ids: number[],
    direction: "in" | "out",
  ): Promise<void> => {
    if (ids.length === 0) return;
    setMoving(true);

    const settled = await Promise.allSettled(
      ids.map((storeid) =>
        direction === "in"
          ? assignStoreToBaseGroups(ctx.url, ctx.token, storeid, [group.id])
          : unassignStoreFromBaseGroup(ctx.url, ctx.token, storeid, group.id),
      ),
    );

    const outcomes: StoreOutcome[] = settled.map((res, i) => {
      const storeid = ids[i];
      if (res.status === "rejected") {
        return { storeid, ok: false, reason: callReason(res.reason) };
      }
      const j = res.value.data;
      if (j.error !== 0) {
        return { storeid, ok: false, reason: j.msg ?? "The server refused it." };
      }
      return {
        storeid,
        ok: true,
        granted: j.granted_to_users,
        skippedSingleStore: j.skipped_single_store_users,
        revoked: j.revoked_from_users,
      };
    });

    const summary =
      direction === "in"
        ? summarizeAssign(outcomes, group.name)
        : summarizeUnassign(outcomes, group.name);

    setMoving(false);
    onRefetchStores();
    markUsersStale();
    if (summary.tone === "success") toast.success(summary.text);
    else toast.error(summary.text);
  };

  const handleAssign = (ids: number[]) => void moveStores(ids, "in");
  const handleUnassign = (ids: number[]) => void moveStores(ids, "out");

  const assigned = stores?.assigned ?? [];
  const unassigned = stores?.unassigned ?? [];

  return (
    <div>
      <div className="flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            // Saved once, on blur: Enter blurs (so a rename goes out once) and
            // Escape blurs without saving.
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                cancelRename.current = true;
                e.currentTarget.blur();
              }
            }}
            className="basic-input bg-custom-white py-0.5 px-2 text-[15px] font-medium"
          />
        ) : (
          <span className="text-[16px] font-medium text-content mr-1.5">
            {group.name}
          </span>
        )}
        <IconButton
          icon={PencilIcon}
          title="Rename"
          onClick={() => setEditing((v) => !v)}
        />
        <IconButton
          icon={TrashIcon}
          title="Delete group"
          variant="danger"
          onClick={() => setConfirmDelete(true)}
        />
        <div className="flex-1" />
        <IconButton
          icon={ArrowDownTrayIcon}
          title="Export this group's stores or users to CSV"
          onClick={() => setExportOpen(true)}
        />
      </div>
      <div className="text-[11.5px] text-content/85 mb-2">{companyName}</div>

      <div data-help="group-tabs" className="flex border-b border-gray-100 mb-4">
        {(["stores", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`text-[12px] font-semibold py-2 px-4 capitalize border-b-2 transition-colors ${
              subTab === t
                ? "border-brand_navy text-brand_navy"
                : "border-transparent text-content"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "stores" &&
        (!stores ? (
          <div className="text-[11.5px] text-content/85">Loading…</div>
        ) : (
          <div data-help="assign" className="w-full">
            {/* One call per store, and each reaches every user holding this
                group, so say it is working. */}
            <div className="h-4 mb-1">
              {moving && (
                <span className="text-[11px] font-semibold text-content/85">
                  Moving stores, and updating who can see them…
                </span>
              )}
            </div>
            <AssignPanel
              leftTitle="Unassigned"
              rightTitle="Assigned"
              leftItems={unassigned.map((s) => ({
                id: s.storeid,
                label: s.store_name,
              }))}
              rightItems={assigned.map((s) => ({
                id: s.storeid,
                label: s.store_name,
              }))}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              moving={moving}
              confirmBulk={(direction, ids) =>
                groupStoresConfirm({ direction, count: ids.length, group: group.name })
              }
            />
          </div>
        ))}

      {subTab === "users" && <BaseGroupUsersTab group={group} users={users} />}

      {exportOpen && (
        <BaseGroupExportModal
          onClose={() => setExportOpen(false)}
          group={group}
          companyName={companyName}
          assigned={assigned}
          unassigned={unassigned}
          users={users}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message="This removes the group and its store assignments. Everyone who holds it loses its stores, unless another group gives them. This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default BaseGroupDetail;
