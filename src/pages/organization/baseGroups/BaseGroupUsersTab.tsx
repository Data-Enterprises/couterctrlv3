import { useEffect, useState } from "react";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
} from "../../../api/team";
import type {
  BaseGroupJsonResp,
  CompanyBaseGroup,
  JsonError,
} from "../../../interfaces";
import AssignPanel from "../components/AssignPanel";

interface Props {
  group: CompanyBaseGroup;
}

// There's no endpoint for "which users have this base group" directly, only
// the reverse (a user's own base groups) — so each candidate's column is
// resolved with its own call to that per-user endpoint (same one the
// profile's own Base groups tab uses) rather than one bulk lookup. A pending
// backend addition (a real "users in this base group" + batch-assign
// endpoint) will let this collapse down to far fewer calls later.
const BaseGroupUsersTab = ({ group }: Props) => {
  const ctx = useOrganizationCtx();
  const toast = useToast();
  const [statusByUser, setStatusByUser] = useState<Record<number, boolean>>(
    {},
  );

  const candidates = ctx.users.filter(
    (u) =>
      u.companies.some((c) => c.company === group.company) &&
      u.user_level <= ctx.userLevel,
  );

  const fetchStatus = (userid: number) => {
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, userid)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          const has = j.active.some((bg) => bg.id === group.id);
          setStatusByUser((prev) => ({ ...prev, [userid]: has }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(() => {
    setStatusByUser({});
  }, [group.id]);

  useEffect(() => {
    candidates.forEach((u) => {
      if (!(u.id in statusByUser)) fetchStatus(u.id);
    });
  }, [candidates.map((u) => u.id).join(","), group.id]);

  const resolvedCount = candidates.filter((u) => u.id in statusByUser).length;
  const pendingCount = candidates.length - resolvedCount;

  const handleAssign = (ids: number[]) => {
    Promise.all(
      ids.map((userid) =>
        assignBaseGroupToUser(ctx.url, ctx.token, userid, [group.id]).then(
          (resp) => ({ userid, ok: resp.data.error === 0 }),
        ),
      ),
    )
      .then((results) => {
        const succeeded = results.filter((r) => r.ok).map((r) => r.userid);
        if (succeeded.length > 0) {
          setStatusByUser((prev) => {
            const next = { ...prev };
            succeeded.forEach((id) => (next[id] = true));
            return next;
          });
        }
        const failed = results.length - succeeded.length;
        if (failed > 0) toast.error(`${failed} user(s) could not be assigned`);
        else toast.success("User(s) assigned");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUnassign = (ids: number[]) => {
    Promise.all(
      ids.map((userid) =>
        deleteUserBaseGroupLink(ctx.url, ctx.token, userid, [group.id]).then(
          (resp) => ({ userid, ok: resp.data.error === 0 }),
        ),
      ),
    )
      .then((results) => {
        const succeeded = results.filter((r) => r.ok).map((r) => r.userid);
        if (succeeded.length > 0) {
          setStatusByUser((prev) => {
            const next = { ...prev };
            succeeded.forEach((id) => (next[id] = false));
            return next;
          });
        }
        const failed = results.length - succeeded.length;
        if (failed > 0)
          toast.error(`${failed} user(s) could not be unassigned`);
        else toast.success("User(s) unassigned");
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const unassigned = candidates.filter((u) => statusByUser[u.id] === false);
  const assigned = candidates.filter((u) => statusByUser[u.id] === true);

  return (
    <div className="max-w-[560px]">
      {pendingCount > 0 && (
        <div className="text-[10.5px] text-content/50 mb-2">
          Resolving {pendingCount} more user{pendingCount === 1 ? "" : "s"}…
        </div>
      )}
      <AssignPanel
        leftTitle="Unassigned"
        rightTitle="Assigned"
        leftItems={unassigned.map((u) => ({
          id: u.id,
          label: u.username,
          sublabel: u.email,
        }))}
        rightItems={assigned.map((u) => ({
          id: u.id,
          label: u.username,
          sublabel: u.email,
        }))}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
};

export default BaseGroupUsersTab;
