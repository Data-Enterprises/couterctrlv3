import { useState } from "react";
import { useSuggestedCtx } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getSuggestedGroup, getSuggestedItems } from "../../api/suggested";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { setSelectedGroupStores } from "../../features/userSlice";
import {
  setGroupRows,
  setItems,
  setParameters,
  setCoverage,
  setRequestedStoreIds,
  setSheetKey,
  setExpandedStores,
  setLoadingGroup,
  setLoadingItems,
  setExportOpen,
  setLeadDays,
  setCoverDays,
  resetSuggestedResults,
  type SheetKey,
} from "../../features/suggestedSlice";
import { isGroupSearch } from "../../features/searchSlice";
import { formatGoliathDate } from "../../utils";
import { deptLabel } from ".";
import type {
  JsonError,
  Store,
  SuggestedGroupResp,
  SuggestedItemsResp,
} from "../../interfaces";

import SearchCard from "../../components/SearchCard";
import SuggestedExportModal from "./SuggestedExportModal";
import EmptyPrompt from "../../components/EmptyPrompt";
import StoreTreePanel from "./StoreTreePanel";
import OrderSheetPanel from "./OrderSheetPanel";

/**
 * Suggested Order — pounds to buy for each scale item.
 *
 * Two calls, deliberately not one. The group call answers store x sub
 * department and drives the tree; the item sheet is fetched per department when
 * one is opened, because item rows across twenty stores are tens of thousands
 * nobody acts on — the same reason the endpoint refuses a group at item level.
 *
 * Dev API only today, which is what puts the page behind the programmer gate in
 * Coming Soon rather than a build flag.
 */
const Suggested = () => {
  const ctx = useSuggestedCtx();
  const toast = useToast();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  /** The model inputs, shared by both calls so the sheet cannot be computed
   *  under a different window than the rollup it was opened from. */
  const modelArgs = () => ({
    asOf: formatGoliathDate(ctx.singleDate),
    leadDays: ctx.leadDays,
    coverDays: ctx.coverDays,
    lookbackWeeks: ctx.lookbackWeeks,
  });

  const handleSearch = () => {
    if (isGroupSearch(ctx.type)) {
      getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, ctx.lastGroup)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const active = j.stores.filter((s: Store & { active?: boolean }) => s.active);
            ctx.dispatch(setSelectedGroupStores(active));
            fetchGroup(active.map((s: Store) => s.storeid), 1);
          } else {
            toast.warn(j.msg);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      fetchGroup([ctx.lastStore], 0);
    }
  };

  const fetchGroup = (storeids: number[], useGroups: number) => {
    ctx.dispatch(resetSuggestedResults());
    ctx.dispatch(setRequestedStoreIds(storeids));
    ctx.dispatch(setLoadingGroup(true));

    getSuggestedGroup(ctx.url, ctx.token, {
      ...modelArgs(),
      useGroups,
      searchValue: useGroups ? ctx.lastGroup : ctx.lastStore,
    })
      .then((resp) => {
        const j: SuggestedGroupResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Could not load suggestions");
          return;
        }
        setNotice(
          j.items.length === 0
            ? "No scale departments came back for this search."
            : undefined,
        );
        ctx.dispatch(setGroupRows(j.items));
        ctx.dispatch(setParameters(j.parameters));
        ctx.dispatch(setCoverage(j.data_coverage));
        // The response echoes what was asked for; trust it over our own list so
        // "18 of 20" reflects the server's view rather than the client's.
        if (j.parameters?.storeids?.length) {
          ctx.dispatch(setRequestedStoreIds(j.parameters.storeids));
        }
        // Open the heaviest store so the page lands on something to read
        // rather than an empty sheet beside a collapsed list.
        const first = [...j.items].sort(
          (a, b) => (b.suggested_weight ?? 0) - (a.suggested_weight ?? 0),
        )[0];
        if (first) ctx.dispatch(setExpandedStores([first.storeid]));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingGroup(false)));
  };

  /**
   * The sheet for one store's department.
   *
   * Filtered client-side by department rather than sent as `subDepartments`:
   * that parameter reads the inventory join, which is null on exactly the rows
   * that already lost their department name — so filtering server-side would
   * silently drop the "No department" bucket instead of showing it.
   */
  const openDepartment = (key: SheetKey) => {
    ctx.dispatch(setSheetKey(key));
    ctx.dispatch(setItems([]));
    ctx.dispatch(setLoadingItems(true));

    getSuggestedItems(ctx.url, ctx.token, key.storeid, modelArgs())
      .then((resp) => {
        const j: SuggestedItemsResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Could not load the sheet");
          return;
        }
        ctx.dispatch(
          setItems(
            j.items.filter((i) => i.sub_department === key.sub_department),
          ),
        );
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingItems(false)));
  };

  const orderControls = (
    <div className="flex items-center gap-2">
      <label className="flex flex-col gap-0.5 flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Lead days
        </span>
        <input
          type="number"
          min={0}
          value={ctx.leadDays}
          onChange={(e) =>
            ctx.dispatch(setLeadDays(Math.max(0, Number(e.target.value) || 0)))
          }
          className="border-0 border-b border-gray-300 bg-transparent text-[13px] text-content py-0.5 tabular-nums"
          style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
        />
      </label>
      <label className="flex flex-col gap-0.5 flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Cover days
        </span>
        <input
          type="number"
          min={1}
          value={ctx.coverDays}
          onChange={(e) =>
            ctx.dispatch(setCoverDays(Math.max(1, Number(e.target.value) || 1)))
          }
          className="border-0 border-b border-gray-300 bg-transparent text-[13px] text-content py-0.5 tabular-nums"
          style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
        />
      </label>
    </div>
  );

  const searchCard = (onDone?: () => void) => (
    <SearchCard
      title="Suggested Order"
      description="Pick a store or group and the day the order is placed. Lead and cover days should add up to your ordering rhythm."
      buttonLabel="Build order"
      singleDate
      onSearch={() => {
        onDone?.();
        handleSearch();
      }}
      loading={ctx.loadingGroup}
      loadingMessage="Working out what to order..."
      notice={notice}
      extraControls={orderControls}
    />
  );

  if (ctx.isMobile) {
    return (
      <div className="h-[calc(100vh-3rem)] p-4">
        <EmptyPrompt
          title="Desktop only for now"
          description="The order sheet is a two-panel report and has no phone form yet."
        />
      </div>
    );
  }

  const hasData = ctx.groupRows.length > 0;
  if (!hasData && !ctx.loadingGroup) return searchCard();

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {ctx.exportOpen && ctx.sheetKey && (
        <SuggestedExportModal
          items={ctx.items}
          groupRows={ctx.groupRows}
          storeLabel={ctx.sheetKey.storeLabel}
          departmentLabel={deptLabel(ctx.sheetKey.sub_department_description)}
          coverWindow={ctx.parameters?.cover_window ?? null}
          onClose={() => ctx.dispatch(setExportOpen(false))}
        />
      )}

      <StoreTreePanel
        onSelectDepartment={openDepartment}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <OrderSheetPanel />

      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            {searchCard(() => setSearchModalOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suggested;
