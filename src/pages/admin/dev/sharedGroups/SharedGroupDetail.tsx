import { useEffect, useRef, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  addSharedGroupStores,
  deleteSharedGroup,
  getSharedGroupUsers,
  removeSharedGroupStores,
  renameSharedGroup,
  shareSharedGroups,
  unshareSharedGroups,
} from "../../../../api/sharedGroups";
import type {
  SharedGroup,
  SharedGroupUser,
  SharedGroupUsersResp,
} from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import IconButton from "../../../../components-dev/IconButton";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import { errorText, storeLabel, useSharedGroupsCtx } from "./hooks";

interface Props {
  group: SharedGroup;
  companyName: string;
  /** Re-reads the company's shared groups after any change to this one. */
  onChanged: () => void;
  onDeleted: () => void;
}

type Envelope = { error: number; msg?: string };

/**
 * One shared group: its name, its stores, and who can search with it.
 *
 * Store changes reach the owner and every recipient at once. Sharing only lets
 * someone search with the group — it never changes which stores they can
 * open, so there is nothing to stage or confirm here except delete.
 */
const SharedGroupDetail = ({ group, companyName, onChanged, onDeleted }: Props) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [subTab, setSubTab] = useState<"stores" | "users">("stores");
  const [users, setUsers] = useState<SharedGroupUser[] | null>(null);
  const activeGroupId = useRef(group.id);

  useEffect(() => {
    setEditing(false);
    setNameDraft(group.name);
    setConfirmDelete(false);
  }, [group.id, group.name]);

  useEffect(() => {
    setSubTab("stores");
  }, [group.id]);

  const loadUsers = () => {
    const forGroup = group.id;
    activeGroupId.current = forGroup;
    getSharedGroupUsers(ctx.url, ctx.token, group.company)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: SharedGroupUsersResp = resp.data;
        if (j.error === 0) setUsers(j.users);
        else toast.error(j.msg || "Could not load users");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    setUsers(null);
    if (subTab === "users") loadUsers();
  }, [group.id, subTab]);

  /** Every write answers the same envelope; this reads it the same way. */
  const write = (
    p: Promise<{ data: Envelope }>,
    ok: string,
    fail: string,
    after: () => void,
  ) =>
    p
      .then((resp) => {
        if (resp.data.error === 0) {
          toast.success(ok);
          after();
        } else {
          toast.error(resp.data.msg || fail);
        }
      })
      .catch((err) => toast.error(errorText(err)));

  const handleSave = () => {
    const name = nameDraft.trim();
    if (name === group.name.trim()) {
      setEditing(false);
      return;
    }
    if (!name) {
      toast.error("Group name is required");
      return;
    }
    write(
      renameSharedGroup(ctx.url, ctx.token, group.id, group.company, name),
      "Shared group renamed",
      "Could not rename the shared group",
      () => {
        setEditing(false);
        onChanged();
      },
    );
  };

  const handleDelete = () =>
    write(
      deleteSharedGroup(ctx.url, ctx.token, group.id, group.company),
      "Shared group deleted",
      "Could not delete the shared group",
      onDeleted,
    );

  const inGroup = new Set(group.stores.map((s) => s.storeid));
  const stores = ctx.companyStores(group.company, group.stores);
  const sharedWith = new Set(group.userids);
  // The owner's rows are the group itself; they're never a recipient.
  const candidates = (users ?? []).filter((u) => u.userid !== group.owner);

  const userItem = (u: SharedGroupUser) => ({
    id: u.userid,
    label: u.username,
    sublabel:
      [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || undefined,
  });

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
          title="Delete shared group"
          variant="danger"
          onClick={() => setConfirmDelete(true)}
        />
      </div>
      <div className="text-[11.5px] text-content/85 mb-2">
        {companyName} · {group.stores.length} store
        {group.stores.length === 1 ? "" : "s"} · shared with {group.userids.length}
      </div>

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

      {subTab === "stores" && (
        <>
          <p className="text-[11px] text-content/60 mb-2">
            Changes reach everyone the group is shared with. A shared group keeps
            at least one store; to empty it, delete it.
          </p>
          <AssignPanel
            leftTitle="Not in the group"
            rightTitle="In the group"
            leftItems={stores
              .filter((s) => !inGroup.has(s.storeid))
              .map((s) => ({ id: s.storeid, label: storeLabel(s) }))}
            rightItems={group.stores.map((s) => ({
              id: s.storeid,
              label: storeLabel(s),
            }))}
            onAssign={(ids) =>
              write(
                addSharedGroupStores(ctx.url, ctx.token, group.id, group.company, ids),
                "Stores added",
                "Could not add stores",
                onChanged,
              )
            }
            onUnassign={(ids) =>
              write(
                removeSharedGroupStores(ctx.url, ctx.token, group.id, group.company, ids),
                "Stores removed",
                "Could not remove stores",
                onChanged,
              )
            }
          />
        </>
      )}

      {subTab === "users" &&
        (users === null ? (
          <div className="text-[11.5px] text-content/60">Loading users…</div>
        ) : (
          <>
            <p className="text-[11px] text-content/60 mb-2">
              Sharing lets someone search with this group. It doesn't change
              which stores they can open.
            </p>
            <AssignPanel
              leftTitle="Not shared with"
              rightTitle="Shared with"
              leftItems={candidates.filter((u) => !sharedWith.has(u.userid)).map(userItem)}
              rightItems={candidates.filter((u) => sharedWith.has(u.userid)).map(userItem)}
              onAssign={(ids) =>
                write(
                  shareSharedGroups(ctx.url, ctx.token, group.company, [group.id], ids),
                  "Shared",
                  "Could not share the group",
                  () => {
                    onChanged();
                    loadUsers();
                  },
                )
              }
              onUnassign={(ids) =>
                write(
                  unshareSharedGroups(ctx.url, ctx.token, group.company, [group.id], ids),
                  "Unshared",
                  "Could not unshare the group",
                  () => {
                    onChanged();
                    loadUsers();
                  },
                )
              }
            />
          </>
        ))}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message="This removes the group for everyone it's shared with. Nobody loses access to a store. This can't be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default SharedGroupDetail;
