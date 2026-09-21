import { useEffect, useRef, useState } from "react";
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

  const levelOf = new Map(users.map((u) => [u.id, u.user_level]));
  const withinReach = (r: BaseGroupUserRow) =>
    (levelOf.get(r.userid) ?? 0) <= ctx.userLevel;

  const run = (
    ids: number[],
    call: (userid: number) => Promise<{ data: { error: number } }>,
    verb: string,
  ) => {
    Promise.all(
      ids.map((userid) =>
        call(userid).then((resp) => ({ userid, ok: resp.data.error === 0 })),
      ),
    )
      .then((results) => {
        const failed = results.filter((r) => !r.ok).length;
        if (failed > 0) toast.error(`${failed} user(s) could not be ${verb}`);
        else toast.success(`User(s) ${verb}`);
        load();
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleAssign = (ids: number[]) =>
    run(
      ids,
      (userid) => assignBaseGroupToUser(ctx.url, ctx.token, userid, [group.id]),
      "assigned",
    );

  const handleUnassign = (ids: number[]) =>
    run(
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
      {loading && assigned.length + unassigned.length === 0 && (
        <div className="text-[10.5px] text-content/50 mb-2">Loading users…</div>
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
