import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useGroupCtx } from ".";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  updateGroup,
  deleteGroup,
  getStoresAssignedToUserGroup,
  addStoreToGroup,
  removeStoreFromGroup,
} from "../../../api/groups";
import type { Group, StoreWithGroupStatus } from "../../../features/groupSlice";
import type { JsonError } from "../../../interfaces";
import IconButton from "../../../components/IconButton";
import ConfirmModal from "../../../components/ConfirmModal";
import TextFilter from "../../../components/filters/TextFilter";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

interface Props {
  group: Group;
  onRenamed: (newName: string) => void;
  onDeleted: () => void;
}

const byFilter = (
  stores: StoreWithGroupStatus[],
  filter: string,
  active: 0 | 1,
) =>
  stores
    .filter((s) => s.active === active)
    .filter((s) => s.store_name.toLowerCase().includes(filter.toLowerCase()));

// Selected group's rename/delete + store assign panel, all in one view — no
// separate "Update"/"Delete"/"Assign stores" tabs. Store assignment keeps the
// existing immediate-toggle-with-pending-row model (not AssignPanel's staged
// batch model) since that was a deliberate, already-approved improvement over
// legacy's fire-and-forget toggle.
const GroupDetail = ({ group, onRenamed, onDeleted }: Props) => {
  const ctx = useGroupCtx();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.group_name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stores, setStores] = useState<StoreWithGroupStatus[] | null>(null);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [unassignedFilter, setUnassignedFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  // A shared group is the store group assignments/share_bg_with_users builds
  // from a base group. Renaming it breaks the by-name lookup that share and
  // unshare both use, and any store edit is reverted the next time the manager
  // syncs — so it is shown but never edited here.
  const readOnly = group.is_shared;

  useEffect(() => {
    setEditing(false);
    setNameDraft(group.group_name);
    setConfirmDelete(false);
    setUnassignedFilter("");
    setAssignedFilter("");
    setStores(null);
    getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const sorted = [...j.stores].sort(
            (a: StoreWithGroupStatus, b: StoreWithGroupStatus) =>
              b.active - a.active,
          );
          setStores(sorted);
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, [group.id]);

  const handleSave = () => {
    if (readOnly) return;
    if (nameDraft.trim() === group.group_name.trim()) {
      setEditing(false);
      return;
    }
    if (!nameDraft.trim()) {
      toast.error("Group name is required");
      return;
    }
    updateGroup(ctx.url, ctx.token, ctx.userid, group.id, nameDraft.trim())
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          toast.success("Group updated successfully");
          setEditing(false);
          onRenamed(nameDraft.trim());
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleDelete = () => {
    if (readOnly) return;
    deleteGroup(ctx.url, ctx.token, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          toast.success("Group deleted successfully");
          onDeleted();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const setStorePending = (storeid: number, isPending: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      isPending ? next.add(storeid) : next.delete(storeid);
      return next;
    });
  };

  const handleToggle = (storeid: number, type: "assigned" | "unassigned") => {
    if (readOnly) return;
    setStorePending(storeid, true);
    const call =
      type === "assigned"
        ? removeStoreFromGroup(ctx.url, ctx.token, ctx.userid, group.id, storeid)
        : addStoreToGroup(ctx.url, ctx.token, ctx.userid, group.id, storeid);

    call
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          setStores((prev) =>
            prev
              ? prev
                  .map((s) =>
                    s.storeid === storeid
                      ? ({ ...s, active: s.active === 1 ? 0 : 1 } as StoreWithGroupStatus)
                      : s,
                  )
                  .sort((a, b) => b.active - a.active)
              : prev,
          );
        } else {
          toast.error("Unable to update store assignment");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setStorePending(storeid, false));
  };

  const unassigned = byFilter(stores ?? [], unassignedFilter, 0);
  const assigned = byFilter(stores ?? [], assignedFilter, 1);

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1">
          {editing ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="basic-input bg-custom-white py-0.5 px-2 text-[15px] font-medium"
            />
          ) : (
            <span className="text-[16px] font-medium text-content mr-1.5">
              {group.group_name}
            </span>
          )}
          {readOnly ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Shared
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>
        {readOnly && (
          <div className="text-[12px] text-content/75 mt-1">
            Shared with you by a manager. The name and store list are managed
            with the base group and can't be changed here.
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 p-4">
        {stores === null ? (
          <div className="relative min-h-[260px]">
            <LoadingIndicator message="Loading stores" />
          </div>
        ) : (
          <div className="h-full flex gap-3">
            {/* A shared group has nothing to add to, so the picker side is
                dropped entirely rather than shown with dead buttons. */}
            {!readOnly && (
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="mb-1.5">
                <TextFilter
                  value={unassignedFilter}
                  onChange={setUnassignedFilter}
                  placeholder="Search unassigned…"
                />
              </div>
              <div className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content bg-gray-50">
                Unassigned ({unassigned.length})
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar border border-t-0 border-gray-100">
                {unassigned.map((s) => (
                  <div
                    key={s.storeid}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] text-content border-b border-gray-100 ${
                      pending.has(s.storeid) ? "opacity-40" : ""
                    }`}
                  >
                    <span className="truncate">{s.store_name}</span>
                    <button
                      onClick={() => handleToggle(s.storeid, "unassigned")}
                      disabled={pending.has(s.storeid)}
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[13px] font-semibold text-[#1e2a4a] border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                ))}
                {unassigned.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-[12px] text-content">
                    No stores found
                  </div>
                )}
              </div>
            </div>
            )}

            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="mb-1.5">
                <TextFilter
                  value={assignedFilter}
                  onChange={setAssignedFilter}
                  placeholder="Search assigned…"
                />
              </div>
              <div className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content bg-gray-50">
                Assigned ({assigned.length})
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar border border-t-0 border-gray-100">
                {assigned.map((s) => (
                  <div
                    key={s.storeid}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] text-content border-b border-gray-100 ${
                      pending.has(s.storeid) ? "opacity-40" : ""
                    }`}
                  >
                    <span className="truncate">{s.store_name}</span>
                    {!readOnly && (
                      <button
                        onClick={() => handleToggle(s.storeid, "assigned")}
                        disabled={pending.has(s.storeid)}
                        className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[13px] font-semibold text-red-600 border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
                {assigned.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-[12px] text-content">
                    No stores found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.group_name}?`}
          message="This removes the group and its store assignments. This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default GroupDetail;
