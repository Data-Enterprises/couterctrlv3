// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSalesCtx } from "../hooks";
import { useDeptInvestigation, useItemsGrid } from "./hooks";

// Redux
import { setInvestigation } from "../../../../features/salesLedgerSlice";

// Utils
import { metricFormat } from "../utils";
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import { supplyWindow } from "./utils/investigationData";
import {
  desksOf,
  holdsUp,
  spreadOf,
  supplyOf,
  vitalsOf,
} from "./utils/investigationSteps";
import { cash, shortStore } from "./utils";
import { rowsOf } from "./utils/holdsRows";
import { HANDOFF_NAME, handoffKey } from "./utils/handoff";
import { CSV_HEADERS, csvRow } from "./utils/columns";

// Interfaces
import type { HandoffList, InvestigationTab } from "./interfaces";

// Components
import TabSkeleton from "./components/TabSkeleton";
import SummaryTab from "./summary/SummaryTab";
import ReceiptsNote from "./components/ReceiptsNote";
import SupplyTab from "./supply/SupplyTab";
import HandoffTab from "./handoff/HandoffTab";
import InvestigationHeader from "./components/InvestigationHeader";
import InvestigationTabs from "./components/InvestigationTabs";
import ItemsTab from "./items/ItemsTab";

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

  const fmt = metricFormat(gradingMetric === "qty");

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

  const { filters, sorted, show, supplyUpcs, setSupplyUpcs } =
    useItemsGrid(items);
  const { setOnly, setVendorQ } = filters;

  /* The three steps the grid does not answer. All three are arithmetic over
     items already in hand, so changing tab asks for nothing. */
  const holds = useMemo(
    () =>
      holdsUp(
        items,
        target?.focus ?? "unknown",
        shortStore(target?.storeName ?? "this store"),
        shortStore(target?.compareStoreName ?? "the other store"),
      ),
    [items, target?.focus, target?.storeName, target?.compareStoreName],
  );
  const rows = useMemo(() => rowsOf(items), [items]);
  const spread = useMemo(() => spreadOf(items), [items]);
  const vitals = useMemo(() => vitalsOf(items), [items]);
  const supply = useMemo(
    () => supplyOf(orders, receipts, items),
    [orders, receipts, items],
  );
  const desks = useMemo(() => desksOf(items), [items]);

  /** One person's list, every cause on it, named for who it is going to.
   *  The rows carry their cause, so one file holds the whole list. The
   *  whole-grid export in the header is a different file and says so. */
  const exportList = (l: HandoffList) => {
    if (!target) return;
    const name = [
      target.storeNumber,
      target.subDeptName.replace(/[^A-Za-z0-9]+/g, "-"),
      HANDOFF_NAME[handoffKey(l.owner)].replace(/[^A-Za-z0-9]+/g, "-"),
      twEnd,
    ].join("_");
    downloadCsv(rowsToCsv(CSV_HEADERS, l.items.map(csvRow)), `${name}.csv`);
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

  if (!target) return null;

  const supply_ = supplyWindow({ start: twStart, end: twEnd });
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

      {allIn && !receipts.ok && <ReceiptsNote />}

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
            <SummaryTab
              holds={holds}
              rows={rows}
              spread={spread}
              summary={summary}
              us={target.storeName}
              them={target.compareStoreName}
              vitals={vitals}
              fmt={fmt}
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
              onFindInSupply={(upc) => {
                setSupplyUpcs(upc);
                setTab("supply");
              }}
            />
          )}

          {tab === "supply" && allIn && (
            <SupplyTab
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
            <HandoffTab
              desks={desks}
              us={shortStore(target.storeName)}
              them={shortStore(target.compareStoreName)}
              fmt={fmt}
              onShow={(c) => {
                setOnly(c);
                setTab("items");
              }}
              onExport={exportList}
              onPickItem={(code) => {
                show(code);
                setTab("items");
              }}
            />
          )}

          <ItemsTab
            open={tab === "items" && salesIn}
            items={items}
            stage={stage}
            allIn={allIn}
            summary={summary}
            window={supply_}
            sales={sales}
            orders={orders}
            receipts={receipts}
            onOpenSupply={(upcs) => {
              setSupplyUpcs(upcs);
              setTab("supply");
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DeptInvestigation;
