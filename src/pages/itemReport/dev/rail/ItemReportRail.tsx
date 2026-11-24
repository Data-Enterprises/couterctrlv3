// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useItemReportCtx } from "../hooks";

// Redux
import { toggleItemReportSection } from "../../../../features/dev/devItemReportSlice";

// Utils
import { unitPrice } from "../../../../utils/pricePoints";
import { buildPriceEras, mergePricePoints } from "../utils/priceEras";

// Interfaces
import type { PricePointsState } from "../../../../hooks/usePricePoints";
import type { ActualFetchState } from "../../../../hooks/useActualPricePoints";
import type {
  ActionKind,
  ReportItem,
  ReceiptLine,
  PeriodLabels,
} from "../interfaces";
import type { Fold } from "./interfaces";

// Components
import TransactionSheet from "./components/TransactionSheet";
import Kpi from "./components/Kpi";
import RailHeader from "./components/RailHeader";
import VerdictStrip from "./components/VerdictStrip";
import ReceivedBlock from "./components/ReceivedBlock";
import MovementBlock from "./components/MovementBlock";
import SinceDeliveryBlock from "./components/SinceDeliveryBlock";
import PricePointsBlock from "./components/PricePointsBlock";
import TransactionsBlock from "./components/TransactionsBlock";

interface ItemReportRailProps {
  item: ReportItem | null;
  receipts: ReceiptLine[];
  receivingComplete: boolean;
  lookbackDays: number;
  periods: PeriodLabels;
  actual: ActualFetchState;
  /** The price table, from `cashiers/price_points`. */
  prices: PricePointsState;
  /** Opening a price needs the receipts behind it, which are not fetched
   *  until somebody asks. */
  onOpenPrice: () => void;
  /** The selected item's suggested action, carried through to the basket view
   *  so its line there matches its chip on the sheet. */
  action?: ActionKind;
  /** The sentence behind that action. It reads here rather than under every row
   *  in the list, where it broke the columns apart. */
  evidence?: string;
}

/**
 * The detail beside the sheet: what arrived, what moved, what it rang at.
 *
 * Deliberately thin and deliberately dumb. The sheet already states the finding
 * and the evidence; this exists so nobody has to leave the report to check the
 * numbers behind a line before acting on it. It is a reference column, not a
 * second report — anything needing a paragraph belongs in the evidence line,
 * where it will actually be read.
 *
 * The period strip at the top is the app's standard KPI strip with units in
 * place of dollars. Sales are deliberately absent: this page is about physical
 * movement, and the money lives in the sheet's trailing column and in the
 * export, where it can't crowd out the figure that matters here.
 */
const ItemReportRail = ({
  item,
  receipts,
  receivingComplete,
  lookbackDays,
  periods,
  actual,
  prices,
  onOpenPrice,
  action,
  evidence,
}: ItemReportRailProps) => {
  const dispatch = useAppDispatch();
  const { collapsedSections: collapsed } = useItemReportCtx();
  /** Which price row is open, or null. Local: a transient overlay over one
   *  selected item that closes on its own — the route-change argument that put
   *  the rest of this page in Redux doesn't apply. */
  const [openPrice, setOpenPrice] = useState<number | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  /** Sections showing their full list. Local, not slice: unlike a fold — which
   *  is a standing preference — this is about the item currently in front of
   *  you, and the count in the label belongs to that item. */
  const [showAll, setShowAll] = useState<string[]>([]);
  // Reset on a new item. The counts belong to whichever item is open, so a
  // section left expanded would greet the next one with a wall of rows it was
  // never asked for.
  useEffect(() => {
    setShowAll([]);
  }, [item?.productCode]);

  const isAll = (id: string) => showAll.includes(id);
  const toggleAll = (id: string) =>
    setShowAll((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  /** One place that knows how a section folds, so the sections can't drift
   *  on the key they use or the handler they pass. */
  const fold = (id: string): Fold => ({
    id,
    collapsed: collapsed.includes(id),
    onToggle: () => dispatch(toggleItemReportSection(id)),
  });
  const eras = useMemo(
    () => (item ? buildPriceEras(item, receipts) : []),
    [item, receipts],
  );
  const isCurrent = !!item && prices.upc === item.productCode;
  /** Receipts, for the modal behind a price. Loaded on demand now, so this is
   *  empty until somebody opens one. */
  const linesIn = !!item && actual.upc === item.productCode;

  /**
   * Price points merged by price alone, from the server's table.
   *
   * `cashiers/price_points` answers in one small response, and `unit_price` is
   * PER POUND where the item is weighed, so a random-weight item no longer
   * lists package prices (finding AS).
   *
   * Still merged by price. The server splits on price type and on whether the
   * item rang as a multiple, which matters to Price Opt. Here, what the item
   * rang at is the whole question.
   */
  const mergedPrices = useMemo(
    () => mergePricePoints(isCurrent ? prices.rows : []),
    [isCurrent, prices.rows],
  );

  if (!item) {
    return (
      <div className="flex-shrink-0 shadow-lg" style={{ width: "38%" }}>
        <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
          <p className="text-[12px] text-content text-center leading-relaxed">
            Pick a row for its deliveries and prices.
          </p>
        </div>
      </div>
    );
  }

  // Which of the two stock blocks to show. They measure the same shelf and are
  // not interchangeable: the span block divides everything received in the
  // window by everything sold in it, while the anchored one starts at a known
  // delivery. At exactly one delivery the span block is strictly the worse of
  // the two — its Sold includes days *before* that delivery landed, charging
  // sales made from earlier stock against it — so the anchored block stands in.
  // With none it is all there is; with two or more they answer different
  // questions and both earn their space.
  const showSince = item.sinceDelivery !== null;
  const showMovement =
    item.movement === null ? !showSince : item.movement.deliveries !== 1;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "38%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <RailHeader item={item} />

        {action && evidence && (
          <VerdictStrip
            action={action}
            evidence={evidence}
            open={actionOpen}
            setOpen={setActionOpen}
          />
        )}

        <div className="grid grid-cols-3 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
          <Kpi label="TY Units" dates={periods.tw} units={item.ty.units} />
          <Kpi
            label="vs Last Week"
            dates={periods.lw}
            units={item.lw?.units ?? null}
            pct={item.lwPct}
          />
          <Kpi
            label="vs Last Year"
            dates={periods.ly}
            units={item.ly?.units ?? null}
            pct={item.lyPct}
          />
        </div>

        <div className="cc-scroll rounded-b-xl">
          <ReceivedBlock
            fold={fold("received")}
            receipts={receipts}
            receivingComplete={receivingComplete}
            lookbackDays={lookbackDays}
            expanded={isAll("received")}
            onToggleAll={() => toggleAll("received")}
          />

          {showMovement && (
            <MovementBlock fold={fold("movement")} movement={item.movement} />
          )}

          {item.sinceDelivery && (
            <SinceDeliveryBlock
              fold={fold("delivery")}
              since={item.sinceDelivery}
            />
          )}

          <PricePointsBlock
            fold={fold("prices")}
            eras={eras}
            last={receipts[0] ?? null}
            expanded={isAll("prices")}
            onToggleAll={() => toggleAll("prices")}
          />

          {isCurrent && (
            <TransactionsBlock
              fold={fold("transactions")}
              loading={prices.loading}
              prices={mergedPrices}
              expanded={isAll("transactions")}
              onToggleAll={() => toggleAll("transactions")}
              onOpen={(price) => {
                setOpenPrice(price);
                onOpenPrice();
              }}
            />
          )}
        </div>
      </div>

      {openPrice !== null && (
        <TransactionSheet
          productCode={item.productCode}
          itemDescription={item.description}
          price={openPrice}
          action={action}
          // Same per-unit match the row above uses, so the modal and the
          // count that opened it can't disagree.
          lines={(linesIn ? actual.lines : []).filter(
            (l) => Math.abs(unitPrice(l) - openPrice) < 0.005,
          )}
          onClose={() => setOpenPrice(null)}
        />
      )}
    </div>
  );
};

export default ItemReportRail;
