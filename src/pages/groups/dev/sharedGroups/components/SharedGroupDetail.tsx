// Hooks
import { useEffect, useState } from "react";
import { useSharedGroupLists, useSharedGroupsCtx } from "../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// API
import {
  addSharedGroupStores,
  deleteSharedGroup,
  removeSharedGroupStores,
  renameSharedGroup,
  shareSharedGroups,
  unshareSharedGroups,
} from "../../../../../api/sharedGroups";

// Utils
import { storeLabel } from "../utils";

// Interfaces
import type {
  SharedGroup,
  SharedGroupStoreRow,
  SharedGroupUser,
} from "../../../../../interfaces";

// Components
import ConfirmModal from "../../../../../components-dev/ConfirmModal";
import GroupNameRow from "./GroupNameRow";
import StoresTab from "./StoresTab";
import UsersTab from "./UsersTab";

interface SharedGroupDetailProps {
  group: SharedGroup;
  onChanged: () => void;
  onRenamed: () => void;
  onDeleted: () => void;
}

/**
 * One of the caller's shared groups: its name, its stores, and who can search with it. Only its creator manages it, not who it was shared with.
 */
const SharedGroupDetail = ({
  group,
  onChanged,
  onRenamed,
  onDeleted,
}: SharedGroupDetailProps) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const { subTab, setSubTab, users, stores, loadUsers, loadStores, write } =
    useSharedGroupLists(group);

  useEffect(() => {
    setConfirmDelete(false);
  }, [group.id, group.name]);

  const handleRename = (name: string, done: () => void) =>
    write(
      renameSharedGroup(ctx.url, ctx.token, group.id, name),
      "Shared group renamed",
      "Could not rename the shared group",
      () => {
        done();
        onRenamed();
      },
    );

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

  const hasIt = (u: SharedGroupUser) => u.shared_group_ids.includes(group.id);
  const others = (users ?? []).filter((u) => u.userid !== ctx.userid);
  // Anyone who has the group stays listed, whatever their level, so it can
  // always be taken back. Sharing it out goes to your level or below.
  const sharedWith = others.filter(hasIt);
  const shareable = others.filter(
    (u) => !hasIt(u) && u.user_level <= ctx.userLevel,
  );
  const noStores = group.stores.length === 0;
  const userItem = (u: SharedGroupUser) => {
    const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return {
      id: u.userid,
      // The search box matches the label, so it carries the name as well as
      // the username.
      label: full ? `${full} (${u.username})` : u.username,
      sublabel: u.email ?? undefined,
    };
  };

  const storeItem = (s: SharedGroupStoreRow) => ({
    id: s.storeid,
    label: s.assigned
      ? storeLabel(s)
      : `${storeLabel(s)} (no longer assigned to you)`,
  });

  const recipients = group.userids.length;

  return (
    <div>
      <GroupNameRow
        groupId={group.id}
        name={group.name}
        onRename={handleRename}
        onDelete={() => setConfirmDelete(true)}
      />
      <div className="text-[11.5px] text-content/95 mb-2">
        {group.stores.length} store{group.stores.length === 1 ? "" : "s"} ·
        shared with {recipients} {recipients === 1 ? "person" : "people"}
      </div>

      <div className="flex border-b border-line_hair mb-4">
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
        (stores === null ? (
          <div className="text-[11.5px] text-content/95">Loading stores…</div>
        ) : (
          <StoresTab
            available={stores
              .filter((s) => !s.active && s.assigned)
              .map(storeItem)}
            inGroup={stores.filter((s) => s.active).map(storeItem)}
            onAdd={(ids) =>
              write(
                addSharedGroupStores(ctx.url, ctx.token, group.id, ids),
                `${ids.length} store${ids.length === 1 ? "" : "s"} added`,
                "Could not add stores",
                afterStores,
              )
            }
            onRemove={(ids) =>
              write(
                removeSharedGroupStores(ctx.url, ctx.token, group.id, ids),
                `${ids.length} store${ids.length === 1 ? "" : "s"} removed`,
                "Could not remove stores",
                afterStores,
              )
            }
          />
        ))}

      {subTab === "users" &&
        (users === null ? (
          <div className="text-[11.5px] text-content/95">Loading users…</div>
        ) : (
          <UsersTab
            shareable={shareable.map(userItem)}
            sharedWith={sharedWith.map(userItem)}
            noStores={noStores}
            onShare={(ids) =>
              noStores
                ? toast.error("Add stores to the group before sharing it")
                : write(
                    shareSharedGroups(ctx.url, ctx.token, [group.id], ids),
                    `Shared with ${ids.length} ${ids.length === 1 ? "person" : "people"}`,
                    "Could not share the group",
                    afterShare,
                  )
            }
            onUnshare={(ids) =>
              write(
                unshareSharedGroups(ctx.url, ctx.token, [group.id], ids),
                `Unshared from ${ids.length} ${ids.length === 1 ? "person" : "people"}`,
                "Could not unshare the group",
                afterShare,
              )
            }
          />
        ))}

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${group.name}?`}
          message={`This removes the group for you${
            recipients
              ? ` and the ${recipients} ${recipients === 1 ? "person" : "people"} it's shared with`
              : ""
          }. Nobody loses access to a store. This can't be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default SharedGroupDetail;
