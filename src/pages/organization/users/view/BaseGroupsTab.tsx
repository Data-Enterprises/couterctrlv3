import { useEffect } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  assignBaseGroupToUser,
  deleteUserBaseGroupLink,
  getBaseGroupsAssignedToUser,
} from "../../../../api/team";
import {
  setUserBaseGroups,
  setUserCompany,
} from "../../../../features/baseGroupSlice";
import type {
  BaseGroupJsonResp,
  JsonError,
  UserCompany,
} from "../../../../interfaces";
import AssignPanel from "../../components/AssignPanel";

const BaseGroupsTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const targetUser = ctx.users.find((u) => u.id === ctx.selectedUserId);
  const userCompanies = targetUser?.companies ?? [];

  const getData = (company: UserCompany) => {
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, ctx.selectedUserId)
      .then((resp) => {
        const j: BaseGroupJsonResp = resp.data;
        if (j.error === 0) {
          const active = j.active.filter(
            (bg) => bg.company === company.company,
          );
          const inactive = j.inactive.filter(
            (bg) => bg.company === company.company,
          );
          ctx.dispatch(setUserBaseGroups({ active, inactive }));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching user's base groups " + err.message),
      );
  };

  useEffect(() => {
    if (userCompanies.length > 0) {
      ctx.dispatch(setUserCompany(userCompanies[0]));
      getData(userCompanies[0]);
    }
  }, [ctx.selectedUserId]);

  const handleCompanySelect = (c: UserCompany) => {
    ctx.dispatch(setUserCompany(c));
    getData(c);
  };

  const submitAssign = (ids: number[]) => {
    assignBaseGroupToUser(ctx.url, ctx.token, ctx.selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && ctx.userCompany) getData(ctx.userCompany);
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const submitUnassign = (ids: number[]) => {
    deleteUserBaseGroupLink(ctx.url, ctx.token, ctx.selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && ctx.userCompany) getData(ctx.userCompany);
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {userCompanies.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCompanySelect(c)}
            className={`text-[11px] px-3 py-1 rounded-full ${
              ctx.userCompany?.company === c.company
                ? "bg-[#1e2a4a] text-custom-white"
                : "bg-custom-white border border-gray-200 text-content"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <AssignPanel
        leftTitle="Unassigned"
        rightTitle="Assigned"
        leftItems={ctx.inactiveBaseGroups.map((bg) => ({
          id: bg.id,
          label: bg.name,
        }))}
        rightItems={ctx.activeBaseGroups.map((bg) => ({
          id: bg.id,
          label: bg.name,
        }))}
        onAssign={submitAssign}
        onUnassign={submitUnassign}
      />
    </div>
  );
};

export default BaseGroupsTab;
