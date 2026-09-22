import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";
import type { Group } from "../../../../features/groupSlice";
import type { JsonError, SharedGroupStore } from "../../../../interfaces";
import { storeLabel, useSharedGroupsCtx } from "./hooks";

/**
 * A group someone else shared with this user — read-only.
 *
 * `groups/stores_assigned_to_user_group` returns the user's own assigned
 * stores, each `active` if it's in the group, so the active ones are exactly
 * what this user can use from it: the group's stores they're assigned to.
 * Anything else in the group isn't theirs to see, and isn't listed.
 */
const SharedWithMeDetail = ({ group }: { group: Group }) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [stores, setStores] = useState<SharedGroupStore[] | null>(null);
  const activeGroupId = useRef(group.id);

  useEffect(() => {
    activeGroupId.current = group.id;
    setStores(null);
    const forGroup = group.id;
    getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, group.id)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j = resp.data;
        if (j.error === 0) {
          setStores(
            (j.stores as (SharedGroupStore & { active: number })[]).filter((s) => s.active),
          );
        } else {
          toast.error(j.msg || "Could not load this group's stores");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, [group.id]);

  return (
    <div>
      <div className="text-[16px] font-medium text-content">{group.group_name}</div>
      <div className="text-[11.5px] text-content/85 mb-3">
        Shared with you · {stores ? `${stores.length} of your stores` : "…"}
      </div>
      <p className="text-[11px] text-content/60 mb-3 max-w-[60ch]">
        You can search with this group from the store picker, under Shared. Only the
        stores in it that you're assigned to are shown, and only the owner can change it.
      </p>

      {stores === null ? (
        <div className="text-[11.5px] text-content/60">Loading stores…</div>
      ) : stores.length === 0 ? (
        <div className="text-[12px] text-content/70">
          None of this group's stores are assigned to you.
        </div>
      ) : (
        <div className="max-w-[520px] rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-[420px] overflow-y-auto thin-scrollbar">
          {stores.map((s) => (
            <div key={s.storeid} className="px-3 py-1.5 text-[12px] text-content">
              {storeLabel(s)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedWithMeDetail;
