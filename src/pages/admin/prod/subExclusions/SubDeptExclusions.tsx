// Hooks
import { useMemo, useState } from "react";
import { useAdminPageCtx } from "../hooks";
import { useExclusionWrites, useSubExclData } from "./hooks";

// Redux
import {
  setSubExclCompanyId,
  setSubExclHashOnly,
  setSubExclSearch,
  setSubExclStoreKey,
} from "../../../../features/adminPageSlice";

// Utils
import { deptState, planStoreToggle, planToggle } from "./utils";

// Interfaces
import type { CompanyDeptRow, DeptAtStore, PendingToggle } from "./interfaces";

// Components
import SubExclToolbar from "./components/SubExclToolbar";
import SubExclNote from "./components/SubExclNote";
import SubExclHead from "./components/SubExclHead";
import CompDeptRow from "./components/CompDeptRow";
import SubExclStatus from "./components/SubExclStatus";
import ExclusionConfirm from "./components/ExclusionConfirm";

/** The Sub Dept Exclusions tab: choose which sub departments stop counting towards net sales, for a whole
 *  company or one store. Filter by company, store, rang-within window, search or Likely hash. Excluding at
 *  more than one store asks for confirmation. */
const SubDeptExclusions = () => {
  const context = useAdminPageCtx();
  const { dispatch } = context;

  // The lists and filters live in Redux, so they are still there after a tab
  // switch; what follows in useState only matters while it is on screen.
  const stores = context.subExclStores;
  const search = context.subExclSearch;
  const hashOnly = context.subExclHashOnly;
  const catalog = context.subExclCatalog;

  const {
    companyOptions,
    companyStores,
    rows,
    loading,
    progress,
    refetchExclusions,
  } = useSubExclData(context);
  const { saving, send } = useExclusionWrites(context, refetchExclusions);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!hashOnly || r.hashHint) &&
        (!q ||
          r.key.includes(q) ||
          String(r.at[0]?.sub_department).includes(q)),
    );
  }, [rows, search, hashOnly]);

  const excludedCount = rows.filter((r) => deptState(r) !== "none").length;
  const suggestedLeft = rows.filter(
    (r) => r.hashHint && deptState(r) !== "all",
  ).length;

  /** A whole row. More than one store gets a confirmation first — a tick that
   *  silently writes twelve stores is the kind of thing somebody does once by
   *  accident and then does not trust the page again. */
  const toggleRow = (row: CompanyDeptRow, want: boolean) => {
    const writes = planToggle(row, want);
    if (writes.length === 0) return;
    if (writes.length > 1) {
      setPending({ writes, label: row.label, want });
      return;
    }
    send(writes, row.label, want);
  };

  const toggleStore = (row: CompanyDeptRow, a: DeptAtStore, next: boolean) =>
    send(
      planStoreToggle(row, a.storeid, next),
      `${row.label} at ${a.store_number}`,
      next,
    );

  const noStores = stores !== null && companyStores.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col p-3">
      <SubExclToolbar
        companyOptions={companyOptions}
        companyId={context.subExclCompanyId}
        onCompany={(v) => dispatch(setSubExclCompanyId(v))}
        companyStores={companyStores}
        storeKey={context.subExclStoreKey}
        onStore={(v) => dispatch(setSubExclStoreKey(v))}
        search={search}
        onSearch={(v) => dispatch(setSubExclSearch(v))}
        hashOnly={hashOnly}
        onHashOnly={() => dispatch(setSubExclHashOnly(!hashOnly))}
        suggestedLeft={suggestedLeft}
      />

      <SubExclNote
        canSeeAllStores={context.canSeeAllStores}
        rowCount={rows.length}
        excludedCount={excludedCount}
      />

      <div className="border border-line_hair rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <SubExclHead />

        <div className="cc-scroll divide-y divide-brand_navy/15">
          {filtered.map((row) => (
            <CompDeptRow
              key={row.key}
              row={row}
              expanded={open === row.key}
              onToggleOpen={() => setOpen(open === row.key ? null : row.key)}
              saving={saving}
              onToggleRow={(next) => toggleRow(row, next)}
              onToggleStore={(a, next) => toggleStore(row, a, next)}
            />
          ))}

          <SubExclStatus
            loading={loading}
            progress={progress}
            noStores={noStores}
            empty={catalog !== null && filtered.length === 0}
            anyRows={rows.length > 0}
          />
        </div>
      </div>

      {pending && (
        <ExclusionConfirm
          pending={pending}
          onConfirm={() => {
            send(pending.writes, pending.label, pending.want);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
};

export default SubDeptExclusions;
