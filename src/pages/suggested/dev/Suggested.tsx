import { useState } from "react";
import { useSuggestedCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getSuggestedGroup, getSuggestedItems } from "../../../api/suggested";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { setSelectedGroupStores } from "../../../features/userSlice";
import {
  setGroupRows,
  setItems,
  setParameters,
  setCoverage,
  setRequestedStoreIds,
  setSheetKey,
  setActiveStore,
  setDailyByDepartment,
  setNotSelling,
  setExpandedStores,
  setLoadingGroup,
  setLoadingItems,
  setExportOpen,
  setLeadDays,
  setCoverDays,
  resetSuggestedResults,
  type SheetKey,
} from "../../../features/dev/devSuggestedSlice";
import { isGroupSearch } from "../../../features/searchSlice";
import { getStoreName } from "../../../utils";
import { deptLabel, sheetRows } from ".";
import type {
  JsonError,
  Store,
  SuggestedGroupResp,
  SuggestedItemsResp,
} from "../../../interfaces";

import SearchCard from "../../../components-dev/SearchCard";
import SuggestedExportModal from "./SuggestedExportModal";
import StoreTreePanel from "./StoreTreePanel";
import OrderSheetPanel from "./OrderSheetPanel";

/**
 * Suggested Weight — pounds to buy for each scale item.
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
    asOf: ctx.asOf,
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
        if (first) {
          ctx.dispatch(setExpandedStores([first.storeid]));
          // Load it as well as expand it. The panel opens on that store's Top
          // to order rather than an empty frame telling the buyer to pick.
          openStore(
            first.storeid,
            getStoreName(
              ctx.assignedStores,
              first.storeid,
              first.store_name ?? String(first.storeid),
            ),
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingGroup(false)));
  };

  /**
   * Every scale item in one store, fetched once when the store is opened.
   *
   * This used to run per DEPARTMENT and filter the response down to the one
   * asked for. The endpoint has only ever answered at store grain, so that
   * pulled all ~380 rows and discarded ~70% of them, then pulled the identical
   * payload again on the next department. One call per store is strictly fewer
   * calls than one per department, and holding the whole store is what lets the
   * overview and the store-wide exports come out of a response already in hand.
   *
   * Departments are still filtered client-side rather than through
   * `subDepartments`: that parameter reads the inventory join, which is null on
   * exactly the rows that already lost their department name, so filtering
   * server-side would silently drop the "No department" bucket instead of
   * showing it.
   */
  const openStore = (storeid: number, storeLabel: string) => {
    // Clears the previous store's sheet key, items and not-selling set, so a
    // slow response can never paint one store's rows under another's header.
    ctx.dispatch(setActiveStore({ storeid, label: storeLabel }));
    ctx.dispatch(setLoadingItems(true));

    getSuggestedItems(ctx.url, ctx.token, storeid, modelArgs())
      .then((resp) => {
        const j: SuggestedItemsResp = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Could not load the sheet");
          return;
        }
        ctx.dispatch(setItems(j.items));
        ctx.dispatch(setNotSelling(j.not_selling ?? null));
        // Arrives with the store now rather than for the whole group up front.
        ctx.dispatch(setDailyByDepartment(j.daily_by_department ?? null));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => ctx.dispatch(setLoadingItems(false)));
  };

  /**
   * Pick a department to read. No fetch of its own — the store's items are
   * already here — unless the click came from a different store's open tree,
   * which is the one case where the rows on hand are the wrong ones.
   *
   * Order matters: `setActiveStore` clears the sheet key by design, so the key
   * is dispatched after it rather than before.
   */
  const openDepartment = (key: SheetKey) => {
    if (key.storeid !== ctx.activeStoreId) {
      openStore(key.storeid, key.storeLabel);
    }
    ctx.dispatch(setSheetKey(key));
  };

  const orderControls = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
      <label className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
          Days until delivery
        </span>
        <input
          type="number"
          min={0}
          value={ctx.leadDays}
          onChange={(e) =>
            ctx.dispatch(setLeadDays(Math.max(0, Number(e.target.value) || 0)))
          }
          className="w-full min-w-0 border-0 border-b border-gray-300 bg-transparent text-[13px] text-content py-0.5 tabular-nums"
          style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
        />
      </label>
      <label className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-content/85">
          Cover days
        </span>
        <input
          type="number"
          min={1}
          value={ctx.coverDays}
          onChange={(e) =>
            ctx.dispatch(setCoverDays(Math.max(1, Number(e.target.value) || 1)))
          }
          className="w-full min-w-0 border-0 border-b border-gray-300 bg-transparent text-[13px] text-content py-0.5 tabular-nums"
          style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
        />
      </label>
      </div>
      {/* States what the two are, not what they should be. Every version of
          this that used an example ended up prescribing an ordering rhythm --
          Friday and Monday trucks are one store's week, not everyone's. */}
      <p className="text-[12px] text-content/85 leading-snug">
        Days until delivery runs from placing the order to the truck arriving.
        Cover days runs from that truck to the next one.
      </p>
    </div>
  );

  const searchCard = (onDone?: () => void) => (
    <SearchCard
      title="Suggested Weight"
      description="Pick a store or group, then say how your deliveries run. The two counts should add up to your real ordering rhythm."
      buttonLabel="Build order"
      hideDates
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

  const hasData = ctx.groupRows.length > 0;
  if (!hasData && !ctx.loadingGroup) return searchCard();

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {ctx.exportOpen && ctx.activeStoreId !== null && (
        <SuggestedExportModal
          cycleDays={
            (ctx.parameters?.lead_days ?? ctx.leadDays) +
            (ctx.parameters?.cover_days ?? ctx.coverDays)
          }
          items={ctx.items}
          sheetItems={
            ctx.sheetKey
              ? sheetRows(
                  ctx.items,
                  ctx.sheetKey.sub_department,
                  ctx.upcFilter,
                  ctx.descFilter,
                )
              : []
          }
          groupRows={ctx.groupRows}
          notSelling={ctx.notSelling}
          storeLabel={ctx.activeStoreLabel}
          departmentLabel={
            ctx.sheetKey
              ? deptLabel(ctx.sheetKey.sub_department_description)
              : null
          }
          coverWindow={ctx.parameters?.cover_window ?? null}
          onClose={() => ctx.dispatch(setExportOpen(false))}
        />
      )}

      <StoreTreePanel
        onOpenStore={openStore}
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
