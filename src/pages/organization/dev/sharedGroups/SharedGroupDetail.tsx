import { useEffect, useRef, useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  addSharedGroupStores,
  deleteSharedGroup,
  getSharedGroupStores,
  getSharedGroupUsers,
  removeSharedGroupStores,
  renameSharedGroup,
  shareSharedGroups,
  unshareSharedGroups,
} from "../../../../api/sharedGroups";
import type {
  SharedGroup,
  SharedGroupStoreRow,
  SharedGroupStoresResp,
  SharedGroupUser,
  SharedGroupUsersResp,
} from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import IconButton from "../../../../components-dev/IconButton";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import { errorText, storeLabel, useSharedGroupsCtx } from "./hooks";

interface Props {
  group: SharedGroup;
  /** Re-reads the owner's shared groups after any change to this one. */
  onChanged: () => void;
  onDeleted: () => void;
}

type Envelope = { error: number; msg?: string };

/**
 * One of the caller's shared groups: its name, its stores, and who can search
 * with it. Only its creator manages it.
 *
 * Stores come from the creator's own assigned stores, and changes reach
 * everyone it's shared with. Sharing only puts the group in someone's store
 * picker (and their User Groups tab) — it never changes which stores they can
 * open, and they only get the group's stores they're assigned to.
 */
const SharedGroupDetail = ({ group, onChanged, onDeleted }: Props) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // A new, empty group opens on its stores — it can't be shared until it has
  // some. Otherwise it opens on who it's shared with.
  const [subTab, setSubTab] = useState<"users" | "stores">(
    group.stores.length ? "users" : "stores",
  );
  const [users, setUsers] = useState<SharedGroupUser[] | null>(null);
  const [stores, setStores] = useState<SharedGroupStoreRow[] | null>(null);
  const activeGroupId = useRef(group.id);

  useEffect(() => {
    setEditing(false);
    setNameDraft(group.name);
    setConfirmDelete(false);
  }, [group.id, group.name]);

  useEffect(() => {
    activeGroupId.current = group.id;
    setSubTab(group.stores.length ? "users" : "stores");
    setUsers(null);
    setStores(null);
  }, [group.id]);

  const loadUsers = () => {
    const forGroup = group.id;
    getSharedGroupUsers(ctx.url, ctx.token)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: SharedGroupUsersResp = resp.data;
        if (j.error === 0) setUsers(j.users);
        else toast.error(j.msg || "Could not load users");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  const loadStores = () => {
    const forGroup = group.id;
    getSharedGroupStores(ctx.url, ctx.token, group.id)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: SharedGroupStoresResp = resp.data;
        if (j.error === 0) setStores(j.stores);
        else toast.error(j.msg || "Could not load stores");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    if (subTab === "users") loadUsers();
    else loadStores();
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
      renameSharedGroup(ctx.url, ctx.token, group.id, name),
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
      deleteSharedGroup(ctx.url, ctx.token, group.id),
      "Shared group deleted",
      "Could not delete the shared group",
      onDeleted,
    );

  const afterStores = () => {
    loadStores();
    onChanged();
  };
  const afterShare = () => {
    loadUsers();
    onChanged();
  };

  // Sharing goes to people at the owner's level or below.
  const candidates = (users ?? []).filter(
    (u) => u.userid !== ctx.userid && u.user_level <= ctx.userLevel,
  );
  const hasIt = (u: SharedGroupUser) => u.shared_group_ids.includes(group.id);
  const userItem = (u: SharedGroupUser) => ({
    id: u.userid,
    label: u.username,
    sublabel:
      [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || undefined,
  });

  const storeItem = (s: SharedGroupStoreRow) => ({
    id: s.storeid,
    label: s.assigned ? storeLabel(s) : `${storeLabel(s)} (no longer assigned to you)`,
  });

  const recipients = group.userids.length;

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
          <span className="text-[16px] font-medium text-content mr-1.5">{group.name}</span>
        )}
        <IconButton icon={PencilIcon} title="Rename" onClick={() => setEditing((v) => !v)} />
        <IconButton
          icon={TrashIcon}
          title="Delete shared group"
          variant="danger"
          onClick={() => setConfirmDelete(true)}
        />
      </div>
      <div className="text-[11.5px] text-content/85 mb-2">
        {group.stores.length} store{group.stores.length === 1 ? "" : "s"} · shared with{" "}
        {recipients}
      </div>

      <div className="flex border-b border-gray-100 mb-4">
        {(["users", "stores"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`text-[12px] font-semibold py-2 px-4 capitalize border-b-2 transition-colors ${
              subTab === t ? "border-[#1e2a4a] text-[#1e2a4a]" : "border-transparent text-content"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === "stores" &&
        (stores === null ? (
          <div className="text-[11.5px] text-content/60">Loading stores…</div>
        ) : (
          <>
            <p className="text-[11px] text-content/60 mb-2">
              From the stores you're assigned to. Changes reach everyone the group is shared
              with. Once it's shared, it keeps at least one store — unshare it or delete it
              to empty it.
            </p>
            <AssignPanel
              leftTitle="Your stores"
              rightTitle="In the group"
              leftItems={stores.filter((s) => !s.active && s.assigned).map(storeItem)}
              rightItems={stores.filter((s) => s.active).map(storeItem)}
              verbs={{ assign: "Add", unassign: "Remove" }}
              onAssign={(ids) =>
                write(
                  addSharedGroupStores(ctx.url, ctx.token, group.id, ids),
                  "Stores added",
                  "Could not add stores",
                  afterStores,
                )
              }
              onUnassign={(ids) =>
                write(
                  removeSharedGroupStores(ctx.url, ctx.token, group.id, ids),
                  "Stores removed",
                  "Could not remove stores",
                  afterStores,
                )
              }
            />
          </>
        ))}

      {subTab === "users" &&
        (users === null ? (
          <div className="text-[11.5px] text-content/60">Loading users…</div>
        ) : (
          <>
            <p className="text-[11px] text-content/60 mb-2">
              Sharing puts the group in their User Groups and store picker. It doesn't
              change which stores they can open, and they only see the group's stores
              they're assigned to. People at your level or below who share a company
              with you.
            </p>
            {group.stores.length === 0 && (
              <p className="text-[11px] text-amber-800 mb-2">
                Add stores before sharing this group.
              </p>
            )}
            <AssignPanel
              leftTitle="Not shared with"
              rightTitle="Shared with"
              verbs={{ assign: "Share", unassign: "Unshare" }}
              leftItems={candidates.filter((u) => !hasIt(u)).map(userItem)}
              rightItems={candidates.filter(hasIt).map(userItem)}
              onAssign={(ids) =>
                write(
                  shareSharedGroups(ctx.url, ctx.token, [group.id], ids),
                  "Shared",
                  "Could not share the group",
                  afterShare,
                )
              }
              onUnassign={(ids) =>
                write(
                  unshareSharedGroups(ctx.url, ctx.token, [group.id], ids),
                  "Unshared",
                  "Could not unshare the group",
                  afterShare,
                )
              }
            />
          </>
        ))}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message={`This removes the group for you${
            recipients ? ` and the ${recipients} ${recipients === 1 ? "person" : "people"} it's shared with` : ""
          }. Nobody loses access to a store. This can't be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default SharedGroupDetail;
