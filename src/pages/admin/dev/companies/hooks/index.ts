// Hooks
import { useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import { setRefresh } from "../../../../../features/dev/devAdminPageSlice";
import { setCompanies as setUserCompanies } from "../../../../../features/userSlice";

// API
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
} from "../../../../../api/company";
import { assignUserToCompany } from "../../../../../api/user";

// Utils
import { reasonOf } from "../../../../../utils/serverError";

// Interfaces
import type { Company, CompanyJsonResp } from "../../../../../interfaces";
import type { CompanyRecord } from "../interfaces";
import type { useAdminPageCtx } from "../../hooks";

/**
 * The Companies tab's pop-ups and saves: which company is being created,
 * edited or deleted, and the calls that do it. A new company is assigned to
 * its creator, so they can manage it straight away.
 */
export const useCompanyEdits = (
  context: ReturnType<typeof useAdminPageCtx>,
) => {
  const toast = useToast();
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(
    null,
  );
  const [creating, setCreating] = useState<boolean>(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const claimNewCompany = async (
    before: Set<number>,
    name: string,
    newId: number | undefined,
  ) => {
    let createdId = newId;
    if (!createdId) {
      const resp = await getCompanies(context.url, context.token);
      const j: CompanyJsonResp = resp.data;
      if (j.error !== 0) return false;

      const appeared = j.companies.filter((c) => !before.has(c.id));
      const created =
        appeared.length === 1
          ? appeared[0]
          : appeared.find((c) => c.name === name);
      if (!created) return false;
      createdId = created.id;
    }

    const mine = context.userCompanies.map((c) => c.company);
    const assigned = await assignUserToCompany(
      context.url,
      context.token,
      context.userid,
      [...mine, createdId],
    );
    if (assigned.data.error !== 0) return false;
    context.dispatch(setUserCompanies(assigned.data.companies));
    return true;
  };

  const handleCreate = (form: Company, parent: number | null) => {
    // Read before the create, so what appears after it can be told apart.
    const before = new Set(context.companies.map((c) => c.id));
    createCompany(context.url, context.token, form, parent)
      .then(async (resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg ?? "The company was not created");
          return;
        }
        setCreating(false);
        context.dispatch(setRefresh(true));
        const claimed = await claimNewCompany(
          before,
          form.name,
          typeof j.new_id === "number" ? j.new_id : undefined,
        ).catch(() => false);
        toast.success(
          claimed
            ? "Company created and assigned to you"
            : "Company created — assign it to yourself in User Management",
        );
      })
      .catch((err) => toast.error(reasonOf(err)));
  };

  const handleUpdate = (form: Company, parent: number | null) => {
    updateCompany(context.url, context.token, form, parent)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Company updated successfully");
          setEditingCompany(null);
          context.dispatch(setRefresh(true));
        } else {
          toast.error(j.msg ?? "The company was not updated");
        }
      })
      // The backend refuses a parent that would make a family two deep; its reason is in `detail`.
      .catch((err) => toast.error(reasonOf(err)));
  };

  const handleDeleteConfirm = () => {
    if (!deletingCompany) return;
    deleteCompany(context.url, context.token, deletingCompany.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Company deleted successfully");
          setDeletingCompany(null);
          context.dispatch(setRefresh(true));
        }
      })
      // A company others belong under can't be deleted until they move; the backend says so in `detail`.
      .catch((err) => toast.error(reasonOf(err)));
  };

  return {
    creating,
    setCreating,
    editingCompany,
    setEditingCompany,
    deletingCompany,
    setDeletingCompany,
    handleCreate,
    handleUpdate,
    handleDeleteConfirm,
  };
};
