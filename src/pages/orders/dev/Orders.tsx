// Hooks
import { useMemo, useState } from "react";
import { useTriStateSort } from "../../../utils/useTriStateSort";
import { useOrdersCtx } from "./hooks";
import { useOrderEdit } from "./hooks/edit";
import { useOrderProblems } from "./hooks/problems";
import { useOrdersSearch } from "./hooks/search";

// Redux
import {
  setOrdersExportModalOpen,
  setOrdersFilter,
  clearOrdersFilters,
  setOrdersMarginOver,
  type OrdersFilters,
} from "../../../features/dev/devOrdersSlice";
import { isGroupSearch } from "../../../features/searchSlice";

// Utils
import { buildRows } from "./utils/ordersRows";
import { startDraft, canEditOrders } from "./utils/orderEdit";

// Interfaces
import type { SortKey } from "./interfaces";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import SearchPopup from "../../../components-dev/SearchPopup";
import OrderPickerPanel from "./components/OrderPickerPanel";
import OrderEditPanel from "./components/editPanel/OrderEditPanel";
import SubmitReceipt from "./components/SubmitReceipt";
import OrdersExportModal from "./export/OrdersExportModal";
import ProblemList from "./components/ProblemList";
import ItemFixPanel from "./components/ItemFixPanel";
import OrdersConfigPanel from "./components/OrdersConfigPanel";
import OrderReportPanel from "./components/OrderReportPanel";
import OrdersMobile from "./mobile/OrdersMobile";

/**
 * Orders, as one fetch and a configuration.
 *
 * It used to ask `available_order` what orders existed, draw them as cards,
 * and fetch one card's line items when you picked it. Everything downstream
 * was then scoped to a single store, date and order type — which is why there
 * was no way to ask for one sub department across every order, or to export
 * more than one order at a time.
 *
 * Now the search fetches every line in the range once, from `all_orders`, and
 * the left panel narrows it. `all_orders` is a superset of `available_order`
 * — same storeid, storenumber, order_date, order_type and record_count, plus
 * the sub department, the item and the costs — so nothing the old left panel
 * showed was lost by dropping the first call.
 *
 * The filtering lives here rather than in the slice. Six independent filters
 * reducing one list is a single pass over the result; six reducers each
 * recomputing `filteredOrders` would run it six times and only the last one
 * would be right.
 */
const Orders = () => {
  const ctx = useOrdersCtx();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  /* Who may edit, worked out once a render. `new Date()` rather than a
     memo: the answer turns over at midnight and a memo keyed on nothing
     would hold Wednesday's answer into Thursday. */
  const canEdit = canEditOrders(ctx.userLevel, ctx.companyIds, new Date());
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const {
    editing,
    setEditing,
    drafts,
    openKey,
    submittedCounts,
    setSubmittedCounts,
    receipt,
    setReceipt,
    draft,
    setDraft,
    changedDrafts,
    changedKeys,
    pickStore,
    pickDate,
    pickType,
    setPickStore,
    setPickDate,
    setPickType,
    pending,
    setPending,
    pendingNonce,
    lookingUp,
    submitting,
    loadingSubDepts,
    docs,
    leaveEdit,
    handlePick,
    handleAddLine,
    handlePendingField,
    handlePendingPatch,
    handleConfirmPending,
    handleLookup,
    handleSubmit,
  } = useOrderEdit();
  const {
    leftTab,
    setLeftTab,
    problemCode,
    setProblemCode,
    skipped,
    problemScope,
    scopeStores,
    scopeOrders,
    problemItems,
    toDo,
    openProblem,
    problemPosition,
    handleStageItem,
    handleSkipItem,
  } = useOrderProblems();
  const { handleSearch } = useOrdersSearch(setNotice, setDraft, setReceipt);
  /**
   * The grid's sort lives here rather than in the panel.
   *
   * It used to be local to the report panel, which meant the export —
   * raised from this level — wrote the rows in whatever order the API
   * returned rather than the order on screen.
   */
  const { sort, handleSort, applySort } = useTriStateSort<SortKey>();

  /** One list, built once — the grid draws it and the export writes it. */
  const gridRows = useMemo(
    () => buildRows(ctx.allOrders, ctx.filters, applySort),
    // `sort` rather than `applySort`: the helper is rebuilt every render and
    // closes over the state that actually decides the order.
    [ctx.allOrders, ctx.filters, sort],
  );

  const scopeLabel = isGroupSearch(ctx.type)
    ? (ctx.selectedGroup?.group_name ?? "Group")
    : (ctx.selectedStore?.store_name ?? "Store");

  if (ctx.isMobile) return <OrdersMobile />;

  const hasData = ctx.allOrders.length > 0;

  if (!hasData && !ctx.loadingAllOrders) {
    return (
      <SearchCard
        title="Orders"
        description="Select a store or group and date range to load every order in it."
        buttonLabel="Load orders"
        onSearch={handleSearch}
        loading={ctx.loadingAllOrders}
        loadingMessage="Loading orders..."
        notice={notice}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-3">
      {ctx.ordersExportModalOpen && (
        <OrdersExportModal
          lines={ctx.allOrders}
          filters={ctx.filters}
          applySort={applySort}
          scopeLabel={scopeLabel}
          startDate={ctx.startDate}
          endDate={ctx.endDate}
          onClose={() => ctx.dispatch(setOrdersExportModalOpen(false))}
        />
      )}

      {/* `canEdit` as well as `editing`: the day turns over while a tab is
          open, and an owner who entered on Thursday should not still be in
          edit mode on Friday morning. */}
      {editing && canEdit ? (
        <>
          <OrderPickerPanel
            docs={docs}
            openKey={openKey}
            onPick={handlePick}
            changedKeys={changedKeys}
            storeNumber={pickStore}
            orderDate={pickDate}
            orderType={pickType}
            onStore={setPickStore}
            onDate={setPickDate}
            onType={setPickType}
            onClear={() => {
              setPickStore("");
              setPickDate("");
              setPickType("");
            }}
            onOpenSearch={() => setSearchModalOpen(true)}
            // Only a half-filled new line blocks switching now: every other
            // change stays with its own order's draft.
            blocked={pending !== null}
            startDate={ctx.startDate}
            endDate={ctx.endDate}
            scopeLabel={scopeLabel}
            tab={leftTab}
            onTab={setLeftTab}
            problemsToDo={toDo.length}
            problems={
              <ProblemList
                items={problemItems}
                skipped={skipped}
                openCode={problemCode}
                onPick={setProblemCode}
                marginOver={ctx.filters.marginOver}
                onMarginOver={(v) => ctx.dispatch(setOrdersMarginOver(v))}
                scopeOrders={scopeOrders}
                scopeStores={scopeStores}
              />
            }
          />

          {/* The receipt is laid over this panel, so the two share a stacking
              context of their own rather than the whole page's. */}
          <div className="relative flex flex-1 min-w-0 overflow-hidden">
            {leftTab === "problems" ? (
              <ItemFixPanel
                key={problemCode ?? "none"}
                item={openProblem}
                position={problemPosition}
                scope={problemScope}
                all={ctx.allOrders}
                drafts={drafts}
                onStage={handleStageItem}
                onSkip={handleSkipItem}
                onLeaveEdit={leaveEdit}
                onSubmit={handleSubmit}
                stagedCount={changedDrafts.length}
                submitting={submitting}
              />
            ) : (
              <OrderEditPanel
                onAddLine={handleAddLine}
                pending={pending}
                onPendingField={handlePendingField}
                onPendingPatch={handlePendingPatch}
                onConfirmPending={handleConfirmPending}
                onCancelPending={() => setPending(null)}
                pendingNonce={pendingNonce}
                onLookup={handleLookup}
                lookingUp={lookingUp}
                loadingSubDepts={loadingSubDepts}
                onSubmit={handleSubmit}
                submitting={submitting}
                onLeaveEdit={leaveEdit}
              />
            )}

            <SubmitReceipt
              receipt={receipt}
              orderCount={submittedCounts.orders}
              editedCount={submittedCounts.edited}
              addedCount={submittedCounts.added}
              onClose={() => setReceipt(null)}
              onEditAgain={() => {
                setReceipt(null);
                setPending(null);
                if (draft) setDraft(startDraft(draft.doc, ctx.allOrders));
                setSubmittedCounts({ orders: 0, edited: 0, added: 0 });
              }}
            />
          </div>
        </>
      ) : (
        <>
          <OrdersConfigPanel
            lines={ctx.allOrders}
            filters={ctx.filters}
            onChange={(key: keyof OrdersFilters, values) =>
              ctx.dispatch(setOrdersFilter({ key, values }))
            }
            onMarginOver={(v) => ctx.dispatch(setOrdersMarginOver(v))}
            onClear={() => ctx.dispatch(clearOrdersFilters())}
            loading={ctx.loadingAllOrders}
            matched={gridRows.length}
            startDate={ctx.startDate}
            endDate={ctx.endDate}
            onOpenSearch={() => setSearchModalOpen(true)}
            scopeLabel={scopeLabel}
          />

          <OrderReportPanel
            rows={gridRows}
            sort={sort}
            marginOver={ctx.filters.marginOver}
            onSort={handleSort}
            loading={ctx.loadingAllOrders}
            onExport={() => ctx.dispatch(setOrdersExportModalOpen(true))}
            onEnterEdit={() => setEditing(true)}
            canEdit={canEdit}
          />
        </>
      )}

      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <SearchCard
            title="Orders"
            description="Select a store or group and date range to load every order in it."
            buttonLabel="Load orders"
            onSearch={() => {
              setSearchModalOpen(false);
              handleSearch();
            }}
            loading={ctx.loadingAllOrders}
            loadingMessage="Loading orders..."
          />
        </SearchPopup>
      )}
    </div>
  );
};

export default Orders;
