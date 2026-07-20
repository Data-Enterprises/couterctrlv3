import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { setRefresh, setUserCompanyIds } from "../../../../features/usersSlice";
import { assignUserToCompany } from "../../../../api/user";
import type { JsonError, UserCompany } from "../../../../interfaces";
import AssignPanel from "../../components/AssignPanel";

const CompaniesTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const active = ctx.companies.filter((c) => ctx.userCompanyIds.includes(c.company));
  const inactive = ctx.companies.filter((c) => !ctx.userCompanyIds.includes(c.company));

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
      leftItems={inactive.map((c) => ({ id: c.company, label: c.name }))}
      rightItems={active.map((c) => ({ id: c.company, label: c.name }))}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
    />
  );
};

export default CompaniesTab;
