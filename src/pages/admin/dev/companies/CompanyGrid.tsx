// Hooks
import { useMemo, useState } from "react";
import { useAdminPageCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import { setRefresh } from "../../../../features/dev/devAdminPageSlice";
import { setCompanies as setUserCompanies } from "../../../../features/userSlice";

// API
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
} from "../../../../api/company";
import { assignUserToCompany } from "../../../../api/user";

// Utils
import { companyCols } from "./utils";

// Interfaces
import type {
  Company,
  CompanyJsonResp,
  JsonError,
} from "../../../../interfaces";
import type { CompanyRecord } from "./interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import IconButton from "../../../../components-dev/IconButton";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import CompanyFormModal from "./components/CompanyFormModal";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/20/solid";

/** The Companies tab: a searchable list of companies with Add, Edit and Delete. Shows the parent company
 *  next to a company that sits under one. */
const CompanyGrid = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const [search, setSearch] = useState("");
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(
    null,
  );
  const records = context.companies as CompanyRecord[];
  const nameOf = useMemo(
    () => new Map(records.map((c) => [c.id, c.name])),
    [records],
  );
  const [creating, setCreating] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return context.companies;
    const q = search.toLowerCase();
    return context.companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [context.companies, search]);

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
      .catch((err: JsonError & { response?: { data?: { detail?: string } } }) =>
        toast.error(err.response?.data?.detail ?? err.message),
      );
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
      .catch((err: JsonError & { response?: { data?: { detail?: string } } }) =>
        toast.error(err.response?.data?.detail ?? err.message),
      );
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
      .catch((err: JsonError & { response?: { data?: { detail?: string } } }) =>
        toast.error(err.response?.data?.detail ?? err.message),
      );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <TextFilter
          value={search}
          onChange={setSearch}
          placeholder="Search companies…"
          className="flex-1"
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New company
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[22%_18%_10%_16%_24%_10%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          {companyCols.map((title) => (
            <div key={title}>{title}</div>
          ))}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[22%_18%_10%_16%_24%_10%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50"
            >
              <div className="truncate">
                {c.name}
                {(c as CompanyRecord).parent_company_id ? (
                  <span className="text-[10.5px] text-content/85">
                    {" "}
                    · under{" "}
                    {nameOf.get((c as CompanyRecord).parent_company_id!) ??
                      `#${(c as CompanyRecord).parent_company_id}`}
                  </span>
                ) : null}
              </div>
              <div className="truncate">{c.city}</div>
              <div className="truncate">{c.state}</div>
              <div className="truncate">{c.phone}</div>
              <div className="truncate">{c.contact_email}</div>
              <div className="flex items-center justify-end gap-1">
                <IconButton
                  icon={PencilIcon}
                  title="Edit"
                  onClick={() => setEditingCompany(c)}
                />
                <IconButton
                  icon={TrashIcon}
                  title="Delete"
                  variant="danger"
                  onClick={() => setDeletingCompany(c)}
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No companies found
            </div>
          )}
        </div>
      </div>

      {(creating || editingCompany) && (
        <CompanyFormModal
          initial={editingCompany}
          existingNames={context.companies.map((c) => c.name)}
          companies={records}
          onSave={editingCompany ? handleUpdate : handleCreate}
          onClose={() => {
            setCreating(false);
            setEditingCompany(null);
          }}
        />
      )}

      {deletingCompany && (
        <ConfirmModal
          title={`Delete ${deletingCompany.name}?`}
          message="This can't be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCompany(null)}
        />
      )}
    </div>
  );
};

export default CompanyGrid;
