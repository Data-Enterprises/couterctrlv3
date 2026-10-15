import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { setRefresh, setUserCompanyIds } from "../../../../../features/dev/devUsersSlice";
import { assignUserToCompany } from "../../../../../api/user";
import type { JsonError, UserCompany } from "../../../../../interfaces";
import AssignPanel from "../../../../../components-dev/AssignPanel";

const CompaniesTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  /**
   * What can be handed out, as `{ id, name }`.
   *
   * A programmer gets every company on the system; anyone else gets the ones
   * on their own account, which is the rule this tab has always had. The two
   * sources carry the company id under different names — `Company.id` against
   * `UserCompany.company` — so they are flattened here rather than at every
   * use below.
   *
   * `userCompanyIds` stays the authority on what the TARGET user holds, and
   * the endpoint replaces rather than appends, so a company the assigner
   * cannot see must still survive a save. A programmer sees all of them, and
   * for everyone else the unassign path below filters `userCompanyIds` itself
   * instead of rebuilding the list from what is on screen.
   */
  const assignable = ctx.isProgrammer
    ? ctx.allCompanies.map((c) => ({ id: c.id, name: c.name }))
    : ctx.companies.map((c) => ({ id: c.company, name: c.name }));

  const active = assignable.filter((c) => ctx.userCompanyIds.includes(c.id));
  const inactive = assignable.filter((c) => !ctx.userCompanyIds.includes(c.id));

  const submit = (ids: number[]) => {
    assignUserToCompany(ctx.url, ctx.token, ctx.selectedUserId, ids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          ctx.dispatch(setRefresh(true));
          const companyIds = j.companies.map((c: UserCompany) => c.company);
          ctx.dispatch(setUserCompanyIds(companyIds));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleAssign = (ids: number[]) => {
    submit([...ids, ...ctx.userCompanyIds]);
  };

  const handleUnassign = (ids: number[]) => {
    submit(ctx.userCompanyIds.filter((id) => !ids.includes(id)));
  };

  return (
    <AssignPanel
      leftTitle="Unassigned"
      rightTitle="Assigned"
      leftItems={inactive.map((c) => ({ id: c.id, label: c.name }))}
      rightItems={active.map((c) => ({ id: c.id, label: c.name }))}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
      assignAllScope="global"
    />
  );
};

export default CompaniesTab;
