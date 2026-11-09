// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useBaseGroupsCtx } from "../../hooks";
import {
  useCompanyFilterOptions,
  useCompanyFilterPredicate,
} from "../../utils/companyFilter";
import { useMarkUsersStale } from "../../utils/usersStale";

// API
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
} from "../../../../../api/team";
import {
  getAllStoresInBaseGroup,
  getBaseGroupUsers,
} from "../../../../../api/baseGroups";

// Utils
import { peopleConfirm } from "../../utils/bulkConfirm";
import { accessTypeLabel, grantFor } from "../utils/grantFor";
import { callReason } from "../utils";
import { withinReachOf } from "../utils/userReach";

// Interfaces
import type {
  BaseGroupUserRow,
  BaseGroupUsersResp,
  CompanyBaseGroup,
  JsonError,
  User,
} from "../../../../../interfaces";

// Components
import AssignPanel from "../../../../../components-dev/AssignPanel";
import CompanyFilterSelect from "../../components/CompanyFilterSelect";

interface BaseGroupUsersTabProps {
  group: CompanyBaseGroup;
  users: User[];
}

/** A base group's Users tab: Unassigned and Assigned columns to move people in or out, with a company filter.
 *  Assigning is an access grant only: it writes the base group link, and removing it deletes the link.
 *  Both columns come from groups/base_group_users, which carries no levels, so `users` (which does) keeps
 *  anyone above the acting user's level off both. */
const BaseGroupUsersTab = ({ group, users }: BaseGroupUsersTabProps) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const markUsersStale = useMarkUsersStale();
  const [assigned, setAssigned] = useState<BaseGroupUserRow[]>([]);
  const [unassigned, setUnassigned] = useState<BaseGroupUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** A write is running; the panel's buttons wait for it. */
  const [moving, setMoving] = useState(false);

  // A response for a group the reader has already left must not land here.
  const activeGroupId = useRef(group.id);

  const load = () => {
    const forGroup = group.id;
    activeGroupId.current = forGroup;
    setLoading(true);
    getBaseGroupUsers(ctx.url, ctx.token, group.id, group.company)
      .then((resp) => {
        if (activeGroupId.current !== forGroup) return;
        const j: BaseGroupUsersResp = resp.data;
        if (j.error === 0) {
          setAssigned(j.assigned);
          setUnassigned(j.unassigned);
        } else {
          toast.error(j.msg || "Could not load this group's users");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => {
        if (activeGroupId.current === forGroup) setLoading(false);
      });
  };

  useEffect(() => {
    setAssigned([]);
    setUnassigned([]);
    load();
  }, [group.id]);

  /**
   * Whether this person is the viewer's to see and change. Fails closed;
   * the rule and why are in userReach.ts, which the export reads too.
   */
  const withinReach = useMemo(
    () => withinReachOf(users, ctx.userLevel),
    [users, ctx.userLevel],
  );

  /** Until the levels arrive every row is hidden, which reads as "this group
   *  has nobody" rather than "still loading". Say the second one. */
  const levelsKnown = users.length > 0;

  /**
   * One call per user, `allSettled`: the server refuses some with a 400 (a
   * single-store user can't take a whole group), and one refusal must not sink
   * the batch. The reason comes from FastAPI's `detail`; see `callReason`.
   */
  const run = async (
    ids: number[],
    call: (userid: number) => Promise<{ data: { error: number; msg?: string } }>,
    verb: string,
  ) => {
    setMoving(true);
    const settled = await Promise.allSettled(ids.map((userid) => call(userid)));
    setMoving(false);

    const failures = settled
      .map((res, i) => {
        if (res.status === "rejected") {
          return { userid: ids[i], reason: callReason(res.reason) };
        }
        return res.value.data.error === 0
          ? null
          : {
              userid: ids[i],
              reason: res.value.data.msg ?? "The server refused it.",
            };
      })
      .filter((f): f is { userid: number; reason: string } => f !== null);

    const done = ids.length - failures.length;
    load();
    markUsersStale();

    if (failures.length === 0) {
      toast.success(`${done} user${done === 1 ? "" : "s"} ${verb}`);
      return;
    }
    // The reason is the useful half, so it goes in the message rather than
    // a bare count. They are usually all the same reason.
    const reason = failures[0].reason;
    toast.error(
      done > 0
        ? `${done} ${verb}, ${failures.length} could not be. ${reason}`
        : `Could not be ${verb}. ${reason}`,
    );
  };

  /**
   * Each person gets the group in their own access type (`grantFor`). The
   * roster is read fresh at the moment of assigning.
   */
  const handleAssign = async (ids: number[]) => {
    const anyByStore = ids.some(
      (id) => users.find((u) => u.id === id)?.access_mode === "selected",
    );
    let groupStoreIds: number[] = [];
    if (anyByStore) {
      try {
        const resp = await getAllStoresInBaseGroup(ctx.url, ctx.token, group.id);
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not read this group's stores");
          return;
        }
        groupStoreIds = (j.assigned_stores as { storeid: number }[]).map(
          (s) => s.storeid,
        );
      } catch (err) {
        toast.error((err as JsonError).message);
        return;
      }
    }
    void run(
      ids,
      (userid) => {
        const grant = grantFor(
          users.find((u) => u.id === userid),
          groupStoreIds,
        );
        return assignBaseGroupToUser(
          ctx.url,
          ctx.token,
          userid,
          [group.id],
          grant.mode,
          grant.storeids,
        );
      },
      "assigned",
    );
  };

  const handleUnassign = (ids: number[]) =>
    void run(
      ids,
      (userid) => deleteUserBaseGroupLink(ctx.url, ctx.token, userid, [group.id]),
      "unassigned",
    );

  /** The access type beside each name, so it's clear which grant they'll
   *  get: By store people get the group's stores picked. */
  const toItem = (r: BaseGroupUserRow) => ({
    id: r.userid,
    label: r.username,
    sublabel: [r.email, accessTypeLabel(users.find((u) => u.id === r.userid))]
      .filter(Boolean)
      .join(" · "),
  });

  // A base group's people nearly always hold its company already, so the
  // company filter helps here too. Fed reachable candidates only.
  const [heldFilter, setHeldFilter] = useState("");
  const candidateIds = useMemo(
    () => unassigned.filter(withinReach).map((r) => r.userid),
    [unassigned, withinReach],
  );
  const companyOptions = useCompanyFilterOptions(users, candidateIds);
  const heldPredicate = useCompanyFilterPredicate(users, heldFilter);

  return (
    <div className="w-full">
      {((loading && assigned.length + unassigned.length === 0) ||
        !levelsKnown) && (
        <div className="text-[11px] text-content/85 mb-2">Loading users…</div>
      )}
      <AssignPanel
        leftTitle="Unassigned"
        rightTitle="Assigned"
        leftItems={unassigned.filter(withinReach).map(toItem)}
        rightItems={assigned.filter(withinReach).map(toItem)}
        onAssign={(ids) => void handleAssign(ids)}
        moving={moving}
        confirmBulk={(direction, ids) =>
          peopleConfirm({ direction, ids, me: ctx.userid, what: group.name })
        }
        onUnassign={handleUnassign}
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

export default BaseGroupUsersTab;
