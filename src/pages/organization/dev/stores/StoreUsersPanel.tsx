import { useEffect, useMemo, useRef, useState } from "react";
import { useBaseGroupsCtx } from "../baseGroups/hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  assignStoreToUsers,
  getStoreUsers,
  unassignStoreFromUsers,
  type StoreCandidateRow,
  type StoreUserRow,
} from "../../../../api/storeAccess";
import type { JsonError, Store, User } from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import {
  summarizeAssign,
  summarizeUnassign,
  viaLabel,
} from "./storeUserMembership";

/**
 * Who holds one store.
 *
 * The third of the three tabs that answer "who may see what", and the one
 * that behaves differently from its siblings in a way worth being loud about:
 * **a grant made here is fixed.** It writes an `assigned` row with no group
 * behind it, so no group change can ever revoke it, and Edit user shows it as
 * `direct`. Companies and Base Groups hand over something a group can later
 * take back; this does not.
 *
 * The other asymmetry is on the way out. A user who holds this store through
 * a base group cannot be removed here — the server refuses and names the
 * group. Deleting the row would leave the group link, the group's membership
 * and the store all intact with nothing re-adding it: the removal would look
 * like it worked, and the next re-grant of that group would quietly undo it.
 * So the panel reports the refusal and points at the group.
 */
const StoreUsersPanel = ({
  store,
  users,
}: {
  store: Store;
  /** The full user list, for the level guard. The endpoint takes a bare
   *  userid and checks no levels, so this is what stops a level 7
   *  rearranging a 9. */
  users: User[];
}) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();

  const [assigned, setAssigned] = useState<StoreUserRow[]>([]);
  const [unassigned, setUnassigned] = useState<StoreCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  /** A response for a store the reader has already left must not land here. */
  const activeStoreId = useRef(store.storeid);

  const load = () => {
    const forStore = store.storeid;
    activeStoreId.current = forStore;
    setLoading(true);
    getStoreUsers(ctx.url, ctx.token, forStore)
      .then((resp) => {
        if (activeStoreId.current !== forStore) return;
        const j = resp.data;
        if (j.error === 0) {
          setAssigned(j.assigned ?? []);
          setUnassigned(j.unassigned ?? []);
        } else {
          toast.error(j.msg || "Could not load this store's users");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => {
        if (activeStoreId.current === forStore) setLoading(false);
      });
  };

  useEffect(() => {
    setAssigned([]);
    setUnassigned([]);
    load();
  }, [store.storeid]);

  const levelOf = useMemo(
    () => new Map(users.map((u) => [u.id, u.user_level])),
    [users],
  );

  /**
   * Whether this person is the viewer's to see and change.
   *
   * **Fails closed.** A userid with no level behind it is hidden rather than
   * shown: the endpoint takes a bare userid and checks no levels, so this is
   * the only thing standing between a level 7 and a level 9's access, and a
   * guard that defaults to "probably fine" is not a guard. An unknown level
   * only happens when the user list has not arrived, or when it somehow does
   * not contain somebody the store does — and in both cases showing them is
   * the wrong way to be wrong.
   */
  const withinReach = (r: { userid: number }) => {
    const level = levelOf.get(r.userid);
    return level !== undefined && level <= ctx.userLevel;
  };

  /** Until the list lands every level is unknown, so every row would be
   *  hidden — which reads as "this store has nobody" rather than "still
   *  loading". Say the second one. */
  const levelsKnown = users.length > 0;

  const run = async (userids: number[], direction: "in" | "out") => {
    if (userids.length === 0) return;
    setMoving(true);
    const call =
      direction === "in" ? assignStoreToUsers : unassignStoreFromUsers;

    try {
      const resp = await call(ctx.url, ctx.token, store.storeid, userids);
      const j = resp.data;
      if (j.error !== 0) {
        toast.error(j.msg || "The server refused it");
        return;
      }
      const result = { changed: j.changed ?? [], skipped: j.skipped ?? [] };
      const summary =
        direction === "in"
          ? summarizeAssign(result, store.store_number)
          : summarizeUnassign(result, store.store_number);
      if (summary.tone === "success") toast.success(summary.text);
      else toast.error(summary.text);
    } catch (err) {
      toast.error((err as JsonError).message);
    } finally {
      setMoving(false);
      load();
    }
  };

  const assignedItems = assigned.filter(withinReach).map((r) => ({
    id: r.userid,
    label: r.username,
    // The source is the thing this panel knows that the others do not, so it
    // goes where the eye already is rather than behind a tooltip.
    sublabel: `${viaLabel(r.via)}${r.email ? ` · ${r.email}` : ""}`,
  }));

  const unassignedItems = unassigned.filter(withinReach).map((r) => ({
    id: r.userid,
    label: r.username,
    sublabel: r.email ?? undefined,
  }));

  const viaGroup = assigned.filter((r) => r.via !== null && r.via !== "").length;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-[15px] font-semibold text-content">
            {store.store_number}
          </span>
          <span className="text-[12.5px] text-content/85 ml-2 truncate">
            {store.store_name}
          </span>
        </div>
        <span className="h-4 text-[11px] font-semibold text-content/85 flex-shrink-0">
          {moving ? "Saving…" : loading ? "Loading…" : ""}
        </span>
      </div>

      <p className="text-[11.5px] text-content/85 leading-snug mb-2 max-w-[680px]">
        Assigning here is <span className="font-semibold text-content">fixed</span>{" "}
        access: it belongs to the person, not to a group, so no group change
        can take it away.
        {viaGroup > 0 && (
          <>
            {" "}
            {viaGroup === 1 ? "One user holds" : `${viaGroup} users hold`} this
            store through a base group — those can only be changed on the
            group.
          </>
        )}
      </p>

      {!levelsKnown && (
        <div className="text-[11.5px] text-content/85 mb-2">
          Loading users…
        </div>
      )}

      <AssignPanel
        leftTitle="Not assigned"
        rightTitle="Assigned"
        leftItems={unassignedItems}
        rightItems={assignedItems}
        onAssign={(ids) => void run(ids, "in")}
        onUnassign={(ids) => void run(ids, "out")}
        assignAllScope="global"
      />
    </div>
  );
};

export default StoreUsersPanel;
