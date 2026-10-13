import { useMemo, useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setRefresh } from "../../../features/dev/devAdminPageSlice";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanies,
} from "../../../api/company";
import { assignUserToCompany } from "../../../api/user";
import { setCompanies as setUserCompanies } from "../../../features/userSlice";
import type { Company, CompanyJsonResp, JsonError } from "../../../interfaces";
import TextFilter from "../../../components-dev/filters/TextFilter";
import IconButton from "../../../components-dev/IconButton";
import ConfirmModal from "../../../components-dev/ConfirmModal";
import CompanyFormModal from "./CompanyFormModal";

// Collapses the old separate Create/Update/Delete tabs into one grid with
// icon actions — mirrors how Organization's UserGrid replaced legacy Team's
// separate Browse/Delete grids.
const CompanyGrid = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const [search, setSearch] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return context.companies;
    const q = search.toLowerCase();
    return context.companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [context.companies, search]);

  /**
   * Put the new company on the account that made it.
   *
   * Without this a company is born with nobody in it, and the only way in was
   * a row written by hand in RDS: the Companies tab in User Management can
   * only offer companies the assigner already holds, and the creator holds
   * this one least of all.
   *
   * `assign_user_to_company` REPLACES rather than appends — see legacy's
   * AssignCompanyToUser, which sends the new ids plus every existing one — so
   * the whole set travels or the rest are silently dropped off the most
   * privileged account on the system.
   *
   * The id comes from a re-read rather than the response: `create_company`
   * answers with `error`/`success` and no id. The new company is the one that
   * was not there a moment ago; where two appear at once, because somebody
   * else was creating at the same time, the name settles it. If neither finds
   * it, the company is still created and the grid still refreshes — only the
   * assignment is skipped, and it says so rather than claiming otherwise.
   */
  const claimNewCompany = async (before: Set<number>, name: string) => {
    const resp = await getCompanies(context.url, context.token);
    const j: CompanyJsonResp = resp.data;
    if (j.error !== 0) return false;

    const appeared = j.companies.filter((c) => !before.has(c.id));
    const created =
      appeared.length === 1
        ? appeared[0]
        : appeared.find((c) => c.name === name);
    if (!created) return false;

    const mine = context.userCompanies.map((c) => c.company);
    const assigned = await assignUserToCompany(
      context.url,
      context.token,
      context.userid,
      [...mine, created.id],
    );
    if (assigned.data.error !== 0) return false;
    // The login response seeded `user.companies` and this just changed it.
    // Left stale, the next assignment this session would send yesterday's set
    // and drop the company that was just claimed.
    context.dispatch(setUserCompanies(assigned.data.companies));
    return true;
  };

  const handleCreate = (form: Company) => {
    // Read before the create, so what appears after it can be told apart.
    const before = new Set(context.companies.map((c) => c.id));
    createCompany(context.url, context.token, form)
      .then(async (resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        setCreating(false);
        context.dispatch(setRefresh(true));
        const claimed = await claimNewCompany(before, form.name).catch(
          () => false,
        );
        toast.success(
          claimed
            ? "Company created and assigned to you"
            : "Company created — assign it to yourself in User Management",
        );
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const handleUpdate = (form: Company) => {
    updateCompany(context.url, context.token, form)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Company updated successfully");
          setEditingCompany(null);
          context.dispatch(setRefresh(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
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
      .catch((err: JsonError) => toast.error(err.message));
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
          <div>Name</div>
          <div>City</div>
          <div>State</div>
          <div>Phone</div>
          <div>Contact email</div>
          <div></div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[22%_18%_10%_16%_24%_10%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50"
            >
              <div className="truncate">{c.name}</div>
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
