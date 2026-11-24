// Hooks
import { useMemo, useState } from "react";
import { useAdminPageCtx } from "../hooks";
import { useCompanyEdits } from "./hooks";

// Utils
import { COMPANY_GRID, companyCols } from "./utils";

// Interfaces
import type { CompanyRecord } from "./interfaces";

// Components
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import CompanyToolbar from "./components/CompanyToolbar";
import CompanyRow from "./components/CompanyRow";
import CompanyFormModal from "./components/CompanyFormModal";

/** The Companies tab: a searchable list of companies with Add, Edit and Delete. Shows the parent company
 *  next to a company that sits under one. */
const CompanyGrid = () => {
  const context = useAdminPageCtx();
  const [search, setSearch] = useState<string>("");
  const records = context.companies as CompanyRecord[];
  const nameOf = useMemo(
    () => new Map(records.map((c) => [c.id, c.name])),
    [records],
  );
  const {
    creating,
    setCreating,
    editingCompany,
    setEditingCompany,
    deletingCompany,
    setDeletingCompany,
    handleCreate,
    handleUpdate,
    handleDeleteConfirm,
  } = useCompanyEdits(context);

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((c) => c.name.toLowerCase().includes(q));
  }, [records, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      <CompanyToolbar
        search={search}
        setSearch={setSearch}
        onNew={() => setCreating(true)}
      />

      <div className="border border-line_hair rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div
          className={`grid ${COMPANY_GRID} px-3 py-2 bg-fill_soft text-[9px] cc-caps-strong flex-shrink-0`}
        >
          {companyCols.map((title) => (
            <div key={title}>{title}</div>
          ))}
        </div>
        <div className="cc-scroll divide-y divide-brand_navy/15">
          {filtered.map((c) => (
            <CompanyRow
              key={c.id}
              company={c}
              parentName={
                c.parent_company_id
                  ? (nameOf.get(c.parent_company_id) ??
                    `#${c.parent_company_id}`)
                  : null
              }
              onEdit={() => setEditingCompany(c)}
              onDelete={() => setDeletingCompany(c)}
            />
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
