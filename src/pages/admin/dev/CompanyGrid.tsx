import { useMemo, useState } from "react";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setRefresh } from "../../../features/adminPageSlice";
import { createCompany, updateCompany, deleteCompany } from "../../../api/company";
import type { Company, JsonError } from "../../../interfaces";
import TextFilter from "../../../components/filters/TextFilter";
import IconButton from "../../../components/IconButton";
import ConfirmModal from "../../../components/ConfirmModal";
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

  const handleCreate = (form: Company) => {
    createCompany(context.url, context.token, form)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Company created successfully");
          setCreating(false);
          context.dispatch(setRefresh(true));
        }
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
    <div className="flex-1 flex flex-col min-h-0 p-4 w-[820px]">
      <div className="flex items-center gap-2 mb-3">
        <TextFilter
          value={search}
          onChange={setSearch}
          placeholder="Search companies…"
          className="flex-1"
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 flex-shrink-0"
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
        <div className="max-h-96 overflow-y-auto thin-scrollbar">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[22%_18%_10%_16%_24%_10%] px-3 py-2 text-[12px] items-center border-b border-gray-100 text-content"
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
