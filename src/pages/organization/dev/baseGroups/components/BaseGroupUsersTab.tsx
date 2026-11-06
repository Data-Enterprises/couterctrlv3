import { useEffect, useMemo, useRef, useState } from "react";
import { useBaseGroupsCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
} from "../../../../../api/team";
import {
  getAllStoresInBaseGroup,
  getBaseGroupUsers,
} from "../../../../../api/baseGroups";
import { accessTypeLabel, grantFor } from "../utils/grantFor";
import type {
  BaseGroupUserRow,
  BaseGroupUsersResp,
  CompanyBaseGroup,
  JsonError,
  User,
} from "../../../../../interfaces";
import AssignPanel from "../../../../../components-dev/AssignPanel";
import CompanyFilterSelect from "../../components/CompanyFilterSelect";
import {
  useCompanyFilterOptions,
  useCompanyFilterPredicate,
} from "../../utils/companyFilter";
import { callReason } from "../utils";
import { withinReachOf } from "../utils/userReach";
import { useMarkUsersStale } from "../../utils/usersStale";
import { peopleConfirm } from "../../utils/bulkConfirm";

interface Props {
  group: CompanyBaseGroup;
  users: User[];
}

// Assigning a user to a base group is an access grant and nothing more: it
// writes the base group link (groups/assign_base_group_to_user) and removing
// it deletes that link. Nothing is copied into the user's own store groups —
// sharing is Shared Groups' job.
//
// Both columns come from groups/base_group_users in one call. That endpoint
// doesn't carry user levels, so `users` (the full list, which does) is used to
// keep anyone above the acting user's own level off both columns, as before.
const BaseGroupUsersTab = ({ group, users }: Props) => {
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
   * Run one call per user and say what happened.
   *
   * `allSettled`, not `all`: the server refuses some of these with a 400 —
   * a single-store user cannot be handed a whole group — and that throws.
   * Under `Promise.all` one refusal abandoned the whole batch and reported
   * "Request failed with status code 400", which is both wrong (the others
   * may well have worked) and useless (it does not say why).
   *
   * The reason comes out of FastAPI's `detail`, which never reaches a
   * `.then`. See `callReason`.
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
   * Each person gets the group in their own access type (grantFor): By group
   * as before, or By store with every store the group holds today picked.
   * Always By group made a By store person Mixed. The roster is read once,
   * fresh, at the moment of assigning.
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

  // A base group belongs to one company, and the people who should be in it
  // nearly always already hold that company — so the same narrowing that
  // serves the Companies tab serves this one. Fed the reachable candidates
  // only, so it can hide rows but never reveal any.
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
