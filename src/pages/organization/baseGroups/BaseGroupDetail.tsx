import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { CompanyBaseGroup, JsonError } from "../../../interfaces";
import {
  updateBaseGroup,
  deleteBaseGroup,
  assignStoreToBaseGroup,
  unAssignStoreToBaseGroup,
} from "../../../api/baseGroups";
import AssignPanel from "../components/AssignPanel";
import IconButton from "../components/IconButton";
import ConfirmModal from "../components/ConfirmModal";
import BaseGroupUsersTab from "./BaseGroupUsersTab";
import type { StoreSplit } from "../types";

interface Props {
  group: CompanyBaseGroup;
  companyName: string;
  stores: StoreSplit | undefined;
  onRefetchStores: () => void;
  onDeleted: () => void;
}

const BaseGroupDetail = ({
  group,
  companyName,
  stores,
  onRefetchStores,
  onDeleted,
}: Props) => {
  const ctx = useOrganizationCtx();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [subTab, setSubTab] = useState<"stores" | "users">("stores");

  useEffect(() => {
    setEditing(false);
    setNameDraft(group.name);
    setConfirmDelete(false);
    setSubTab("stores");
  }, [group.id, group.name]);

  const handleSave = () => {
    if (nameDraft.trim() === group.name.trim()) {
      setEditing(false);
      return;
    }
    if (!nameDraft.trim()) {
      toast.error("Group name is required");
      return;
    }
    updateBaseGroup(ctx.url, ctx.token, group.id, nameDraft, group.company)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group updated");
          setEditing(false);
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
          toast.success("Base group deleted");
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
          <div className="max-w-[560px]">
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

      {subTab === "users" && <BaseGroupUsersTab group={group} />}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message="This removes the group and its store assignments. This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default BaseGroupDetail;
