import { useEffect, useMemo, useRef, useState } from "react";
import { useBaseGroupsCtx } from "./hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
} from "../../../../api/team";
import { getBaseGroupUsers } from "../../../../api/baseGroups";
import type {
  BaseGroupUserRow,
  BaseGroupUsersResp,
  CompanyBaseGroup,
  JsonError,
  User,
} from "../../../../interfaces";
import AssignPanel from "../../../../components-dev/AssignPanel";
import { callReason } from "./storeMembership";

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
  const [assigned, setAssigned] = useState<BaseGroupUserRow[]>([]);
  const [unassigned, setUnassigned] = useState<BaseGroupUserRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  const levelOf = useMemo(
    () => new Map(users.map((u) => [u.id, u.user_level])),
    [users],
  );

  /**
   * Whether this person is the viewer's to see and change.
   *
   * **Fails closed.** This used to read `?? 0`, so a userid with no level
   * behind it counted as level 0 and was shown — and until the user list
   * lands that is every row. `assign_base_group_to_user` takes a bare userid
   * and checks no levels, so this is the only thing between a level 7 and a
   * level 9's access, and one that defaults to "probably fine" is not a
   * guard.
   */
  const withinReach = (r: BaseGroupUserRow) => {
    const level = levelOf.get(r.userid);
    return level !== undefined && level <= ctx.userLevel;
  };

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
    const settled = await Promise.allSettled(ids.map((userid) => call(userid)));

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

  const handleAssign = (ids: number[]) =>
    void run(
      ids,
      // "all": the whole group, and whatever is added to it later. That is
      // what this screen means — it assigns a GROUP to people, and has no
      // store picker, so a "selected" grant would have nothing to name.
      // Explicit because the argument is required: the server defaults to
      // "selected" and then refuses it for having no storeids.
      (userid) =>
        assignBaseGroupToUser(ctx.url, ctx.token, userid, [group.id], "all"),
      "assigned",
    );

  const handleUnassign = (ids: number[]) =>
    void run(
      ids,
      (userid) => deleteUserBaseGroupLink(ctx.url, ctx.token, userid, [group.id]),
      "unassigned",
    );

  const toItem = (r: BaseGroupUserRow) => ({
    id: r.userid,
    label: r.username,
    sublabel: r.email ?? undefined,
  });

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
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
};

export default BaseGroupUsersTab;
