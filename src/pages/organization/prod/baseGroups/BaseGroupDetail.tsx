import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import {
  useOrganizationCtx,
  useRefreshUserGroups,
  useRefreshUserStores,
} from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type { CompanyBaseGroup, JsonError } from "../../../../interfaces";
import {
  updateBaseGroup,
  deleteBaseGroup,
  assignStoreToBaseGroup,
  unAssignStoreToBaseGroup,
} from "../../../../api/baseGroups";
import { setBaseGroupExportOpen } from "../../../../features/organizationSlice";
import AssignPanel from "../components/AssignPanel";
import IconButton from "../../../../components/IconButton";
import ConfirmModal from "../../../../components/ConfirmModal";
import BaseGroupUsersTab from "./BaseGroupUsersTab";
import BaseGroupExportModal from "./BaseGroupExportModal";
import type { StoreSplit } from "../types";

interface Props {
  group: CompanyBaseGroup;
  companyName: string;
  stores: StoreSplit | undefined;
  onRefetchStores: () => void;
  onDeleted: () => void;
  onRenamed: (newName: string) => void;
}

const BaseGroupDetail = ({
  group,
  companyName,
  stores,
  onRefetchStores,
  onDeleted,
  onRenamed,
}: Props) => {
  const ctx = useOrganizationCtx();
  const toast = useToast();
  const refreshUserGroups = useRefreshUserGroups();
  const refreshUserStores = useRefreshUserStores();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [subTab, setSubTab] = useState<"stores" | "users">("stores");

  useEffect(() => {
    setEditing(false);
    setNameDraft(group.name);
    setConfirmDelete(false);
    setSubTab("stores");
    ctx.dispatch(setBaseGroupExportOpen(false));
  }, [group.id, group.name]);

  // Both actions below refresh the acting user's own data unconditionally
  // rather than first checking whether they hold a store group from this base
  // group. That check read groupSlice, which is only filled at login — so a
  // store group created earlier in the same session (by syncing yourself) was
  // invisible to it, and the case that most needed the refresh was the one it
  // skipped.

  const handleSave = () => {
    if (nameDraft.trim() === group.name.trim()) {
      setEditing(false);
      return;
    }
    if (!nameDraft.trim()) {
      toast.error("Group name is required");
      return;
    }
    // Trimmed for the same reason create is: the name is copied verbatim into
    // user_groups.group_name and matched exactly by share/unshare, so padding
    // here would follow the rename all the way down.
    updateBaseGroup(ctx.url, ctx.token, group.id, nameDraft.trim(), group.company)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group updated");
          setEditing(false);
          onRenamed(nameDraft.trim());
          refreshUserGroups();
        } else {
          toast.error(j.msg || "Could not update base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleDelete = () => {
    deleteBaseGroup(ctx.url, ctx.token, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          // Deleting now unshares from every member first: their store group is
          // torn down and any store no other base group of theirs grants is
          // revoked. Say how many that touched rather than a bare "deleted".
          toast.success(
            j.user_count > 0
              ? `Base group deleted · unshared from ${j.user_count} user${j.user_count === 1 ? "" : "s"}`
              : "Base group deleted",
          );
          // The delete unshares from every member, so the acting user may have
          // just lost a store group and, with it, any store no other base group
          // of theirs still grants. Both caches have to come back.
          refreshUserGroups();
          refreshUserStores();
          onDeleted();
        } else {
          toast.error(j.msg || "Could not delete base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleAssign = (ids: number[]) => {
    assignStoreToBaseGroup(ctx.url, ctx.token, ids, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) onRefetchStores();
        else toast.error(j.msg || "Could not assign stores");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassign = (ids: number[]) => {
    unAssignStoreToBaseGroup(ctx.url, ctx.token, ids, group.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) onRefetchStores();
        else toast.error(j.msg || "Could not unassign stores");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

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
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
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
      </div>
      <div className="text-[11.5px] text-content/85 mb-2">{companyName}</div>

      <div className="flex border-b border-gray-100 mb-4">
        {(["stores", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`text-[12px] font-semibold py-2 px-4 capitalize border-b-2 transition-colors ${
              subTab === t
                ? "border-[#1e2a4a] text-[#1e2a4a]"
                : "border-transparent text-content"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "stores" &&
        (!stores ? (
          <div className="text-[11.5px] text-content/60">Loading…</div>
        ) : (
          <div className="w-full">
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
            />
          </div>
        ))}

      {subTab === "users" && (
        <BaseGroupUsersTab
          group={group}
          assignedStoreCount={stores ? assigned.length : null}
        />
      )}

      {ctx.baseGroupExportOpen && (
        <BaseGroupExportModal
          onClose={() => ctx.dispatch(setBaseGroupExportOpen(false))}
          groupName={group.name}
          companyName={companyName}
          assigned={assigned}
          unassigned={unassigned}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message="This removes the group and unshares it from everyone holding it — their copy of the group is deleted, and any store no other base group of theirs grants is revoked. This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default BaseGroupDetail;
