// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useTriStateSort } from "../../../../utils/useTriStateSort";
import { useSalesCtx } from "../hooks";
import { useDeptInvestigation, useItemFilters, useRowSelection } from "./hooks";

// Redux
import { setInvestigation } from "../../../../features/dev/devSalesLedgerSlice";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import { supplyWindow } from "./utils/investigationData";
import { CAUSE_LABEL } from "./utils/deptInvestigation";
import {
  desksOf,
  holdsUp,
  spreadOf,
  supplyOf,
  vitalsOf,
  type Desk,
} from "./utils/investigationSteps";
import { cash, PAGE_ROWS, SUGGESTED } from "./utils";
import { CSV_HEADERS, csvRow, sortValue } from "./utils/columns";

// Interfaces
import type { ItemVerdict, Col, InvestigationTab } from "./interfaces";

// Components
import TabSkeleton from "./components/TabSkeleton";
import HoldsPanel from "./components/HoldsPanel";
import SupplyPanel from "./components/SupplyPanel";
import ActPanel from "./components/ActPanel";
import InvestigationHeader from "./components/InvestigationHeader";
import InvestigationTabs from "./components/InvestigationTabs";
import CauseChips from "./components/CauseChips";
import SupplyWindowNote from "./components/SupplyWindowNote";
import GridHead from "./components/GridHead";
import GridBody from "./components/GridBody";
import GridFoot from "./components/GridFoot";
import GridPager from "./components/GridPager";
import EvidenceRail from "./components/EvidenceRail";
import ItemEvidence from "./components/ItemEvidence";
import GridContextMenu from "./components/GridContextMenu";

interface DeptInvestigationProps {
  twStart: string;
  twEnd: string;
  lwStart: string;
  lwEnd: string;
  lyStart: string;
  lyEnd: string;
}

/**
 * Why this store is behind that one, in this department.
 *
 * The page's full-width state. It is reached from a row of the sub-department
 * comparison, and it takes the whole page rather than a panel because the
 * question has outgrown one: by this point the reader is four steps in, and a
 * fifth panel inside a panel is how a drill-down becomes unusable.
 *
 * Everything on screen is `shared/deptInvestigation`'s arithmetic. Nothing is
 * computed here.
 *
 * It fills in three waves — see `useDeptInvestigation`. The grid is readable
 * as soon as sales land; each item's cause sharpens behind it. That is stated
 * on screen rather than hidden, because a cause that changes while somebody
 * is reading it needs to say why.
 */
const DeptInvestigation = ({
  twStart,
  twEnd,
  lwStart,
  lwEnd,
  lyStart,
  lyEnd,
}: DeptInvestigationProps) => {
  const dispatch = useAppDispatch();
  const { gradingMetric, investigation: target } = useSalesCtx();
  const { sort, handleSort, applySort } = useTriStateSort<Col>();
  /** Which item's evidence is open. Held here rather than in the slice: it
   *  belongs to this screen and means nothing once you leave it. */
  const [picked, setPicked] = useState<string | null>(null);
  /**
   * Which step is on screen.
   *
   * Tabs rather than one long scroll: the grid alone is three hundred rows,
   * and a page that puts the hand-off below it leaves the last step
   * reachable only by a shortcut. The three split on the WAVE boundary —
   * "holds" needs sales alone and draws at once, the other two wait — so the
   * structure carries the loading rather than fighting it.
   *
   * The cause filter is shared across them, so moving between steps keeps
   * whatever the reader had narrowed to.
   */
  const [tab, setTab] = useState<InvestigationTab>("holds");

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  const args = useMemo(
    () => ({
      mine: {
        storeid: target?.storeid ?? 0,
        storeNumber: target?.storeNumber ?? "",
        name: target?.storeName ?? "",
        subDept: target?.subDept ?? 0,
      },
      theirs: {
        storeid: target?.compareStoreid ?? 0,
        storeNumber: target?.compareStoreNumber ?? "",
        name: target?.compareStoreName ?? "",
        subDept: target?.compareSubDept ?? 0,
      },
      tw: { start: twStart, end: twEnd },
      lw: { start: lwStart, end: lwEnd },
      ly: { start: lyStart, end: lyEnd },
      metric: gradingMetric,
      enabled: target !== null,
    }),
    [target, twStart, twEnd, lwStart, lwEnd, lyStart, lyEnd, gradingMetric],
  );

  const { stage, items, summary, problem, sales, orders, receipts } =
    useDeptInvestigation(args);

  /* `stage` names the wave still OUTSTANDING. Sales answer the first two
     tabs; the last two need orders and deliveries as well, and a failure
     stops the waiting rather than hanging on it. */
  const salesIn = stage !== "sales";
  const allIn = stage === "done" || stage === "failed";

  const filters = useItemFilters(items);
  const { only, setOnly, setVendorQ, shown } = filters;

  const pickedItem = useMemo(
    () => items.find((i) => i.productCode === picked) ?? null,
    [items, picked],
  );

  /**
   * An item chosen anywhere else lands on the page that holds it.
   *
   * The Summary tab's list and the hand-off's lists both pick an item and
   * switch to the grid. Without this the grid stays on page one and the
   * selected row is somewhere the reader cannot see, which reads as the
   * click having done nothing.
   */
  const show = (code: string) => {
    const i = sorted.findIndex((r) => r.productCode === code);
    if (i >= 0) setPage(Math.floor(i / PAGE_ROWS));
    setPicked(code);
  };

  /* The three steps the grid does not answer. All three are arithmetic over
     items already in hand, so changing tab asks for nothing. */
  const holds = useMemo(
    () => holdsUp(items, target?.focus ?? "unknown"),
    [items, target?.focus],
  );
  const spread = useMemo(() => spreadOf(items), [items]);
  const vitals = useMemo(() => vitalsOf(items), [items]);
  const supply = useMemo(
    () => supplyOf(orders, receipts, items),
    [orders, receipts, items],
  );
  const desks = useMemo(() => desksOf(items, cash), [items]);

  /**
   * The last item the rail showed, kept through the close.
   *
   * The rail slides out over 200ms, and unmounting its contents on the frame
   * the selection clears would empty the panel before it has finished moving
   * — the slide would be of a blank box. Written during render deliberately:
   * an effect would run a frame late, which is exactly the frame that shows.
   */
  const lastEvidence = useRef<ItemVerdict | null>(null);
  if (pickedItem) lastEvidence.current = pickedItem;
  const evidence = pickedItem ?? lastEvidence.current;

  /** One desk's list, named for who it is going to. The whole-grid export
   *  in the header is a different file and says so. */
  const exportDesk = (d: Desk) => {
    if (!target) return;
    const name = [
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      CAUSE_LABEL[d.cause].replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, d.items.map(csvRow)), `${name}.csv`);
  };

  /** Everything the filters left, not the 300 that are drawn. */
  const exportCsv = () => {
    if (!target) return;
    const name = [
      "investigation",
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, sorted.map(csvRow)), `${name}.csv`);
  };

  /** Which page of the grid is showing, from 0. */
  const [page, setPage] = useState(0);

  /** Codes the Supply tab is narrowed to, carried over from the grid. */
  const [supplyUpcs, setSupplyUpcs] = useState("");

  const sorted = applySort(shown, (row, col) => sortValue(row, col));
  const selection = useRowSelection(sorted, picked, setPicked, show);
  const { chosen, ctx, setCtx } = selection;
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_ROWS));
  /* Clamped rather than reset: a filter that shortens the list below the
     current page should land on the last one, not throw the reader back to
     the first. */
  const at_ = Math.min(page, pages - 1);

  const from = at_ * PAGE_ROWS;
  const capped = sorted.slice(from, from + PAGE_ROWS);

  if (!target) return null;

  const supply_ = supplyWindow({ start: twStart, end: twEnd });
  const byCause = new Map(summary.byCause.map((c) => [c.cause, c]));
  /**
   * Sales and margin can point opposite ways, and the headline has to say so.
   *
   * A department can sell more than its counterpart and keep less, because it
   * buys the same goods for more. Reporting only the sales gap calls that a
   * win — which is the thing the cost cause exists to catch, so the sentence
   * at the top cannot go on ignoring it.
   */
  const marginGap = items.reduce((a, i) => a + i.margins.diff, 0);
  const costPenalty = items.reduce(
    (a, i) => a + Math.min(0, i.margins.costPenalty ?? 0),
    0,
  );

  const suggested = SUGGESTED[target.focus ?? ""] ?? [];

  /** Stepping walks the list the GRID is showing, not every item in the
   *  department: arrowing through "never ordered" should not wander out of
   *  it halfway down. It walks the whole filtered list rather than the
   *  page, because a page boundary is a fact about the table and not about
   *  the items — the page follows the rail instead. */
  const at = sorted.findIndex((r) => r.productCode === picked);
  const stepItem = (d: number) => {
    const next = sorted[at + d];
    if (next) setPage(Math.floor((at + d) / PAGE_ROWS));
    if (next) setPicked(next.productCode);
  };

  /**
   * Going back takes as long as it looks like it takes.
   *
   * Unmounting on the click swapped a full page for another full page
   * between two frames, which reads as a jump cut rather than as going
   * back. The notebook plays its exit first and drops itself after, so the
   * ledger arrives into space the notebook has already left.
   */
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => dispatch(setInvestigation(null)), 220);
  };

  /* Escape goes back, the way it does everywhere else that opens over the
     page. Bound to the document because the focus may be anywhere inside
     three hundred rows by the time somebody wants out. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leaving]);

  /** True for as long as the entrance runs, so it plays once. */
  const [fresh, setFresh] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setFresh(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={`h-full cc-panel shadow-card-sm ${
        leaving ? "animate-nb-leave" : ""
      }`}
    >
      {/* The chrome arrives before the contents, top down: the header says
          where you are, the tabs say what is here, and the panel fills in
          under them. Arriving all at once read as a page swap. */}
      <InvestigationHeader
        target={target}
        twStart={twStart}
        twEnd={twEnd}
        salesIn={salesIn}
        allIn={allIn}
        empty={sorted.length === 0}
        onBack={close}
        onExport={exportCsv}
      />

      <InvestigationTabs
        tab={tab}
        onTab={setTab}
        salesIn={salesIn}
        allIn={allIn}
        holds={holds}
        summary={summary}
        supply={supply}
        desks={desks}
      />

      {problem ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/95">
          {problem}
        </div>
      ) : (
        /* Once, on arrival. Replaying it on every tab switch would put
           a third of a second between the click and the answer, which
           is the opposite of what the notebook is for. */
        <div
          className={`flex-1 min-h-0 flex flex-col overflow-hidden ${
            fresh ? "animate-nb-rise motion-reduce:animate-none" : ""
          }`}
          style={fresh ? { animationDelay: "130ms" } : undefined}
        >
          {tab === "holds" && !salesIn && <TabSkeleton tab="holds" />}
          {tab === "items" && !salesIn && <TabSkeleton tab="items" />}
          {tab === "supply" && !allIn && <TabSkeleton tab="supply" />}
          {tab === "act" && !allIn && <TabSkeleton tab="act" />}

          {tab === "holds" && salesIn && (
            <HoldsPanel
              holds={holds}
              spread={spread}
              summary={summary}
              them={target.compareStoreName}
              vitals={vitals}
              cash={cash}
              marginGap={marginGap}
              costPenalty={costPenalty}
              onPickItem={(code) => {
                show(code);
                setTab("items");
              }}
              onVendor={(v) => {
                setVendorQ(v);
                setTab("items");
              }}
              onSeeAll={() => {
                setOnly(null);
                setTab("items");
              }}
            />
          )}

          {tab === "supply" && allIn && (
            <SupplyPanel
              supply={supply}
              us={target.storeName}
              them={target.compareStoreName}
              window={supply_}
              cash={cash}
              orders={orders}
              receipts={receipts}
              upcQuery={supplyUpcs}
              onUpcQuery={setSupplyUpcs}
            />
          )}

          {tab === "act" && allIn && (
            <ActPanel
              desks={desks}
              cash={cash}
              onShow={(c) => {
                setOnly(c);
                setTab("items");
              }}
              onExport={exportDesk}
              onPickItem={(code) => {
                show(code);
                setTab("items");
              }}
            />
          )}

          {/* The grid stays MOUNTED behind `hidden` rather than being
              unmounted with the tab. Three hundred rows is too much to
              rebuild on every switch, and keeping it alive preserves the
              scroll position and the active filter — which matters, because
              step 5's "Show in grid" lands the reader in it.

              The Data Export preview's grid: one real table, every cell
              ruled, mono at 11px, a sticky heading row and a sticky row
              number. Dense is the point — a department is hundreds of items
              and an airy list shows eight of them. */}
          <div
            hidden={tab !== "items" || !salesIn}
            className={
              tab === "items" && salesIn
                ? "flex-1 min-h-0 flex flex-col overflow-hidden"
                : ""
            }
          >
            <div
              data-help="causes"
              className="flex-shrink-0 px-4 py-2.5 border-b border-brand_navy/15"
            >
              <CauseChips
                total={items.length}
                only={only}
                onOnly={setOnly}
                allIn={allIn}
                byCause={byCause}
                suggested={suggested}
                fmt={fmt}
              />

              <SupplyWindowNote
                them={target.compareStoreName}
                window={supply_}
                stage={stage}
              />
            </div>

            <div className="relative flex-1 min-h-0 flex overflow-hidden">
              {/* The grid and the strip under it are one column of the row; the
              rail is the other. Left as siblings of the rail the pager
              became a SECOND column — the grid shrank to its own width and
              the pager floated in the middle of the space beside it. */}
              <div
                data-help="grid"
                className="flex-1 min-w-0 flex flex-col overflow-hidden"
              >
                <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
                  <table className="border-collapse font-mono text-[11px] w-max">
                    <GridHead
                      target={target}
                      filters={filters}
                      byCause={byCause}
                      sort={sort}
                      onSort={handleSort}
                    />
                    <GridBody
                      rows={capped}
                      selection={selection}
                      allIn={allIn}
                      fmt={fmt}
                    />

                    {capped.length > 0 && <GridFoot shown={shown} fmt={fmt} />}
                  </table>

                  {capped.length === 0 && stage !== "sales" && (
                    <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
                      Nothing in this department to compare.
                    </div>
                  )}
                </div>

                {sorted.length > 0 && (
                  <GridPager
                    sorted={sorted}
                    items={items}
                    chosen={chosen}
                    from={from}
                    page={at_}
                    pages={pages}
                    setPage={setPage}
                  />
                )}
              </div>

              <EvidenceRail open={!!pickedItem}>
                {evidence && target && (
                  <ItemEvidence
                    item={evidence}
                    openStoreName={target.storeName}
                    openStoreNumber={target.storeNumber}
                    compareStoreName={target.compareStoreName}
                    compareStoreNumber={target.compareStoreNumber}
                    mineOrders={orders.mine}
                    theirsOrders={orders.theirs}
                    mineReceipts={receipts.mine}
                    theirsReceipts={receipts.theirs}
                    minePoints={sales?.minePoints ?? []}
                    theirsPoints={sales?.theirsPoints ?? []}
                    supplyReady={stage === "done"}
                    position={{
                      at: Math.max(0, at),
                      of: sorted.length,
                      within: only ? CAUSE_LABEL[only] : null,
                    }}
                    onStep={stepItem}
                    onClose={() => setPicked(null)}
                  />
                )}
              </EvidenceRail>
            </div>
          </div>

          {ctx && (
            <GridContextMenu
              ctx={ctx}
              shown={shown}
              chosen={chosen}
              onFind={(upcs) => {
                setSupplyUpcs(upcs);
                setTab("supply");
              }}
              onClose={() => setCtx(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DeptInvestigation;
