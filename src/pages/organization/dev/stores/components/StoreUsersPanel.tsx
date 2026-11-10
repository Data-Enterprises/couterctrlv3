// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useBaseGroupsCtx } from "../../hooks";
import { useMarkUsersStale } from "../../utils/usersStale";
import {
  useCompanyFilterOptions,
  useCompanyFilterPredicate,
} from "../../utils/companyFilter";

// API
import {
  assignStoreToUsers,
  getStoreUsers,
  unassignStoreFromUsers,
  type StoreCandidateRow,
  type StoreUserRow,
} from "../../../../../api/storeAccess";

// Utils
import { peopleConfirm } from "../../utils/bulkConfirm";
import {
  summarizeAssign,
  summarizeUnassign,
  viaLabel,
} from "../utils";

// Interfaces
import type { JsonError, Store, User } from "../../../../../interfaces";

// Components
import AssignPanel from "../../../../../components-dev/AssignPanel";
import CompanyFilterSelect from "../../components/CompanyFilterSelect";

interface StoreUsersPanelProps {
  store: Store;
  /** The full user list, for the level guard: the endpoint checks no levels,
   *  so this stops a level 7 rearranging a 9. */
  users: User[];
}

/**
 * Who holds one store. Unlike the other two tabs, **a grant made here is
 * fixed**: an `assigned` row with no group behind it, shown as `direct` in
 * Edit user, which no group change can revoke.
 *
 * A user who holds the store through a base group can't be removed here: the
 * server refuses and names the group, since the next re-grant would undo it.
 */
const StoreUsersPanel = ({ store, users }: StoreUsersPanelProps) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const markUsersStale = useMarkUsersStale();

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
   * Whether this person is the viewer's to see and change. **Fails closed**:
   * a userid with no known level is hidden, since this is the only level check.
   */
  const withinReach = (r: { userid: number }) => {
    const level = levelOf.get(r.userid);
    return level !== undefined && level <= ctx.userLevel;
  };

  /** Until the user list lands every row is hidden, so say "loading" rather
   *  than "nobody". */
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
      markUsersStale();
    }
  };

  const assignedItems = assigned.filter(withinReach).map((r) => ({
    id: r.userid,
    label: r.username,
    // The source is the thing this panel knows that the others do not, so it
    // goes where the eye already is rather than behind a tooltip.
    sublabel: `${viaLabel(r.via)}${r.email ? ` · ${r.email}` : ""}`,
  }));

  // The store's people nearly always hold its company, so the company filter
  // helps here too, over reachable candidates only.
  const [heldFilter, setHeldFilter] = useState("");
  const candidateIds = useMemo(
    () => unassigned.filter(withinReach).map((r) => r.userid),
    [unassigned, withinReach],
  );
  const companyOptions = useCompanyFilterOptions(users, candidateIds);
  const heldPredicate = useCompanyFilterPredicate(users, heldFilter);

  const unassignedItems = unassigned.filter(withinReach).map((r) => ({
    id: r.userid,
    label: r.username,
    sublabel: r.email ?? undefined,
  }));

  const viaGroup = assigned.filter((r) => r.via !== null && r.via !== "").length;

  return (
    <div className="w-full" data-help="stores">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-[15px] font-semibold text-content">
            {store.store_number}
          </span>
          <span className="text-[12.5px] text-content/95 ml-2 truncate">
            {store.store_name}
          </span>
        </div>
        <span className="h-4 text-[11px] font-semibold text-content/95 flex-shrink-0">
          {moving ? "Saving…" : loading ? "Loading…" : ""}
        </span>
      </div>

      <p className="text-[11.5px] text-content/95 leading-snug mb-2 max-w-[680px]">
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
        <div className="text-[11.5px] text-content/95 mb-2">
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
        // Assign all and Unassign all take what each column is showing,
        // search included, as on the Companies tab.
        moving={moving}
        confirmBulk={(direction, ids) =>
          peopleConfirm({
            direction,
            ids,
            me: ctx.userid,
            what: `store ${store.store_number}`,
          })
        }
        leftPredicate={heldPredicate}
        leftFilters={
          <CompanyFilterSelect
            value={heldFilter}
            onChange={setHeldFilter}
            options={companyOptions}
          />
        }
      />
    </div>
  );
};

export default StoreUsersPanel;
