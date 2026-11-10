// Hooks
import { useEffect, useState } from "react";
import { useGroupCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useForgetDeletedGroup } from "../../../../hooks/useForgetDeletedGroup";

// API
import {
  updateGroup,
  deleteGroup,
  getStoresAssignedToUserGroup,
  addStoreToGroup,
  removeStoreFromGroup,
} from "../../../../api/groups";

// Utils
import { byFilter } from "../utils";

// Interfaces
import type { Group } from "../../../../features/groupSlice";
import type { JsonError, StoreWithGroupStatus } from "../../../../interfaces";

// Components
import IconButton from "../../../../components-dev/IconButton";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import StoreColumn from "./StoreColumn";

interface GroupDetailProps {
  group: Group;
  onRenamed: (newName: string) => void;
  onDeleted: () => void;
}

/** The selected group's panel: rename and delete, plus the Unassigned and Assigned store columns.
 *  A shared group is shown read-only, without the Unassigned column. */
const GroupDetail = ({ group, onRenamed, onDeleted }: GroupDetailProps) => {
  const ctx = useGroupCtx();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.group_name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stores, setStores] = useState<StoreWithGroupStatus[] | null>(null);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [unassignedFilter, setUnassignedFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  // A shared group is managed on this page's Shared Groups tab (owners and up), so here it's shown but never edited.
  const readOnly = group.is_shared;
  const forgetDeletedGroup = useForgetDeletedGroup();

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
          // If this was the group the search is set to, stop using it now, and at the next sign-in.
          forgetDeletedGroup(group.id, { persistPrefs: true });
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
        ? removeStoreFromGroup(
            ctx.url,
            ctx.token,
            ctx.userid,
            group.id,
            storeid,
          )
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
                      ? ({
                          ...s,
                          active: s.active === 1 ? 0 : 1,
                        } as StoreWithGroupStatus)
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
          <div className="text-[12px] text-content/95 mt-1">
            {group.userid === ctx.userid
              ? "A shared group you created. Manage its stores and who has it in Groups > Shared Groups."
              : "Shared with you. Only its stores you're assigned to are shown, and only an owner can change it."}
          </div>
        )}
      </div>

      <div data-help="assign" className="flex-1 min-h-0 p-4">
        {stores === null ? (
          <div className="relative min-h-[260px]">
            <LoadingIndicator message="Loading stores" />
          </div>
        ) : (
          <div className="h-full flex gap-3">
            {/* A shared group has nothing to add to, so the picker side is
                dropped entirely rather than shown with dead buttons. */}
            {!readOnly && (
              <StoreColumn
                kind="unassigned"
                readOnly={readOnly}
                pending={pending}
                filter={unassignedFilter}
                setFilter={setUnassignedFilter}
                stores={unassigned}
                handleToggle={handleToggle}
              />
            )}

            <StoreColumn
              kind="assigned"
              readOnly={readOnly}
              pending={pending}
              filter={assignedFilter}
              setFilter={setAssignedFilter}
              stores={assigned}
              handleToggle={handleToggle}
            />
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
