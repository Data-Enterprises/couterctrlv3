// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useItemReportCtx } from "../hooks";

// Redux
import {
  setItemReportExpandedReceipt,
  toggleItemReportSection,
} from "../../../../features/dev/devItemReportSlice";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../utils";
import { unitPrice } from "../../../../utils/pricePoints";
import { ACTION_LABEL, deliveryGap } from "../utils/verdict";
import { buildPriceEras, mergePricePoints } from "../utils/priceEras";
import { daysSince } from "../utils/metrics";
import { ACTION_TONE } from "../utils/actionTone";
import { MOVEMENT_FALLBACK, TXN_COLS, fmtUnits } from "./utils";

// Interfaces
import type { PricePointsState } from "../../../../hooks/usePricePoints";
import type { ActualFetchState } from "../../../../hooks/useActualPricePoints";
import type { ActionKind, ReportItem, ReceiptLine, PeriodLabels } from "../interfaces";

// Components
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import DetailPopover from "../components/DetailPopover";
import TransactionSheet from "./components/TransactionSheet";
import Kpi from "./components/Kpi";
import Kpis from "./components/Kpis";
import Block from "./components/Block";
import Head from "./components/Head";
import Line from "./components/Line";
import ShowAll from "./components/ShowAll";
import ReceiptDetail from "./components/ReceiptDetail";

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
  const { expandedReceipt, collapsedSections: collapsed } = useItemReportCtx();
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

  /** One place that knows how a section folds, so four call sites can't drift
   *  on the key they use or the handler they pass. */
  const fold = (id: string) => ({
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
   * This was built by walking every receipt the item appeared on, which is
   * what made it wrong on a random-weight item: a receipt line carries what
   * the package came to, so Fam Pak Breast Tenders listed $6.14, $6.94 and
   * $6.86 beside a shelf price of $3.99 a pound (finding AS). It also meant
   * opening any row downloaded about 700 KB of receipts nobody had asked for
   * (finding D).
   *
   * `cashiers/price_points` answers both: one small response, and
   * `unit_price` is PER POUND where the item is weighed.
   *
   * Still merged by price. The server splits on price type and on whether the
   * item rang as a multiple, which matters to Price Opt — it cares how a
   * price was arrived at. Here, what the item rang at is the whole question
   * and why is a column this section does not have.
   */
  const mergedPrices = useMemo(
    () => mergePricePoints(isCurrent ? prices.rows : []),
    [isCurrent, prices.rows],
  );

  /**
   * How often this item normally arrives, across every delivery in the lookback
   * — not just the handful on screen.
   *
   * This replaced a per-row gap. "Last received 24 days ago" is a fact; paired
   * with "usually every 9" it becomes a decision, and one figure in the heading
   * says that better than a dozen unlabelled annotations down the rows, each of
   * which needed explaining.
   */
  // From the metrics, not computed here: the verdict now holds an item to this
  // same interval before zero sales count against it, and a second copy of the
  // arithmetic would have drifted the first time either side changed.
  const avgGap = useMemo(() => deliveryGap(receipts), [receipts]);

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

  const lastDays = receipts[0] ? daysSince(receipts[0].date) : null;

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

  const txnCount = mergedPrices.length;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "38%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 bg-brand_navy rounded-t-xl flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] cc-navy-title leading-tight">
              {item.description}
            </div>
            <div className="text-[12px] mt-0.5 text-custom-white/95 truncate">
              {item.productCode}
            </div>
          </div>
          {/* This panel gets its own glossary rather than sharing the list's.
              The sections here — estimated prices against actual registers,
              how a vendor billed a delivery, what the two modals show — are
              things the left panel's "?" was explaining from across the page,
              or not at all. */}
          <div className="relative flex-shrink-0">
            <PageInfoButton page="item-actions" />
          </div>
        </div>

        {/* The conclusion, before any of the figures behind it — the order the
            UPC Workbook's detail panels use.
            
            Built on `ACTION_TONE` rather than the shared `CtaInsightStrip`: that
            component's vocabulary is direction (up / down / flat), and six
            actions can't map onto three without collapsing the blue and violet
            distinctions the chips already carry. Reusing it would have made the
            strip disagree with the chip that opened it. */}
        {/* Closed by default, and it opens the way the "?" does — anchored
            under its own trigger, dismissed by a click anywhere outside. The
            label alone answers "what do I do"; the sentence is the working
            behind it, and on a Reprice that runs to three lines. */}
        {action && evidence && (
          <div
            data-help="verdict"
            className={`relative flex-shrink-0 border-b border-brand_navy/15 ${ACTION_TONE[action].row}`}
          >
            <button
              onClick={() => setActionOpen((o) => !o)}
              className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-2"
            >
              <span
                className={`text-[11px] font-bold uppercase tracking-wide ${ACTION_TONE[action].text}`}
              >
                {ACTION_LABEL[action]}
              </span>
              <span
                className={`text-[11px] font-medium underline ${ACTION_TONE[action].text}`}
              >
                {actionOpen ? "Hide" : "Why"}
              </span>
            </button>
            <DetailPopover
              open={actionOpen}
              onClose={() => setActionOpen(false)}
              className={`${ACTION_TONE[action].row} ${ACTION_TONE[action].text}`}
            >
              <div className="px-4 py-2.5 text-[13px] leading-relaxed">
                {evidence}
              </div>
            </DetailPopover>
          </div>
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
          <Block
            {...fold("received")}
            label={`Received (${lookbackDays} days)`}
            note={
              lastDays === null
                ? undefined
                : // Reads as a sentence rather than two abbreviations: "every
                  // 8" had no unit at all, and "16d ago" never said ago from
                  // what. The second figure inherits "days" from the first.
                  `Last received ${lastDays === 0 ? "today" : `${lastDays} day${lastDays === 1 ? "" : "s"} ago`}${
                    avgGap === null ? "" : ` · usually every ${avgGap}`
                  }`
            }
            noteTone={(lastDays ?? 0) > 21 ? "text-severity_critical_text" : "text-content"}
          >
            {receipts.length === 0 ? (
              <div className="text-[12px] text-content">
                {receivingComplete
                  ? `None in ${lookbackDays} days`
                  : "Reading…"}
              </div>
            ) : (
              <>
                {/* Cost and retail side by side, with the margin the invoice
                    implied. Three of the four Reprice triggers compare against
                    one of these, so the sentence in the sheet is now checkable
                    against the deliveries that produced it. */}
                <Head cols={["Date", "Qty", "Cost", "Retail", "GM%"]} />
                {(isAll("received") ? receipts : receipts.slice(0, 6)).map(
                  (r, i) => {
                    const key = `${r.invoiceId}-${r.date}-${r.unitCost}`;
                    const open = expandedReceipt === key;
                    const adjusted = r.free > 0 || r.returned > 0;
                    const gm =
                      r.retail > 0
                        ? ((r.retail - r.unitCost) / r.retail) * 100
                        : null;
                    return (
                      <div key={key}>
                        <Line
                          zebra={i % 2 === 1}
                          onClick={() =>
                            dispatch(setItemReportExpandedReceipt(key))
                          }
                          cells={[
                            {
                              // The marker is really the feature. Without
                              // something on the collapsed row saying a delivery
                              // carried free goods or a return, nobody opens
                              // anything and the strip below may as well not
                              // exist.
                              text: `${open ? "▾" : adjusted ? "•" : "›"} ${formatDateSimple(r.date)}`,
                            },
                            // Cases beside units: Receivers shows the
                            // invoice in cases (56), this showed units (224),
                            // and nothing joined the two (finding R).
                            {
                              text:
                                r.cases > 0
                                  ? `${r.sellingUnits} · ${r.cases}cs`
                                  : String(r.sellingUnits),
                            },
                            { text: formatCurrency2(r.unitCost) },
                            {
                              text:
                                r.retail > 0 ? formatCurrency2(r.retail) : "—",
                            },
                            { text: gm === null ? "—" : `${gm.toFixed(1)}%` },
                          ]}
                        />
                        {open && <ReceiptDetail line={r} />}
                      </div>
                    );
                  },
                )}
                {receipts.length > 6 && (
                  <ShowAll
                    total={receipts.length}
                    expanded={isAll("received")}
                    onToggle={() => toggleAll("received")}
                  />
                )}
              </>
            )}
          </Block>

          {showMovement && (
            <Block
              {...fold("movement")}
              label={`Unit movement (${item.movement?.days ?? MOVEMENT_FALLBACK} days)`}
            >
              {item.movement === null ? (
                <div className="text-[12px] text-content">
                  Nothing received or sold
                </div>
              ) : (
                <>
                  {/* Tiles rather than a two-row grid. Every other section here
                      is a list, and Received/Sold/Change is arithmetic, not
                      data — a `Head` plus two `Line`s made the thinnest
                      possible table out of three related figures. The labels
                      also retire the "Measure / Units" header, which was pure
                      scaffolding. */}
                  <Kpis
                    cells={[
                      {
                        label: "Received",
                        value: String(item.movement.received),
                      },
                      { label: "Sold", value: String(item.movement.sold) },
                      {
                        // The answer of the three, so it carries the tone —
                        // positive means the shelf filled faster than it sold,
                        // which is stock that should be findable and may not
                        // be.
                        label: "Change",
                        value: `${item.movement.net > 0 ? "+" : ""}${item.movement.net}`,
                        flagged: item.movement.net > 0,
                      },
                    ]}
                  />
                  <div className="text-[12px] text-content mt-1.5 leading-snug">
                    A change in stock, not a count — there is no opening balance
                    in the data.
                  </div>
                </>
              )}
            </Block>
          )}

          {item.sinceDelivery && (
            <Block
              {...fold("delivery")}
              label={`Since last delivery · ${formatDateSimple(
                item.sinceDelivery.date,
              )}`}
            >
              <Kpis
                cells={[
                  {
                    label: "Delivered",
                    value: String(item.sinceDelivery.received),
                  },
                  { label: "Sold", value: String(item.sinceDelivery.sold) },
                  {
                    // Left neutral on purpose. "Unaccounted" read as a
                    // shortfall — stock that has gone missing — when a positive
                    // figure here is the ordinary case: units still on the
                    // shelf. Flagging it would put the pessimism back that the
                    // rename took out.
                    label: "Left over",
                    value: String(item.sinceDelivery.left),
                  },
                ]}
              />
            </Block>
          )}

          <Block {...fold("prices")} label="Price points">
            {eras.length === 0 ? (
              <div className="text-[12px] text-content">No sales rows</div>
            ) : (
              // Named, not left as "Units". On a weighed item the figure is
              // pounds and the price is per pound, which is what the
              // transactions table below already says -- the two sections sat
              // in one panel disagreeing about the word (finding AS).
              <Head
                cols={
                  eras[0]?.weighed
                    ? ["Price / lb", "Lb", "Days"]
                    : ["Price", "Units", "Days"]
                }
              />
            )}
            {eras.length > 0 &&
              (isAll("prices") ? [...eras] : eras.slice(-4))
                .reverse()
                .map((e) => (
                  <Line
                    key={`${e.start}-${e.price}`}
                    cells={[
                      { text: formatCurrency2(e.price) },
                      { text: fmtUnits(e.units) },
                      { text: String(e.days) },
                    ]}
                  />
                ))}
            {eras.length > 4 && (
              <ShowAll
                total={eras.length}
                expanded={isAll("prices")}
                onToggle={() => toggleAll("prices")}
              />
            )}
            {/* Cost and intended retail are single reference figures, not
                periods the item sold through. As grid rows they filled two of
                three columns and read as price points that had mislaid their
                units; they belong under the table, as the yardsticks it gets
                read against. */}
            {/* The receiver's cost, not the sales file's.
                
                This printed `item.unitCost`, which comes off the sales rows and
                is some blend — on an item whose receivers read $6.85, $6.85,
                $5.50, $6.85 it showed $5.55, which is none of them. Harmless
                while nothing else quoted a cost; not harmless once the strip
                above began saying "below cost at $6.49 against $6.85", because
                the panel then argued with itself and $6.49 looked healthy
                against the footer. Both now name the same invoice. */}
            {(receipts[0]?.unitCost > 0 || receipts[0]?.retail > 0) && (
              <div className="flex items-baseline gap-3 mt-1.5 text-[12px] text-content">
                {receipts[0]?.unitCost > 0 && (
                  <span>
                    Last cost{" "}
                    <span className="font-medium tabular-nums">
                      {formatCurrency2(receipts[0].unitCost)}
                    </span>
                  </span>
                )}
                {receipts[0]?.retail > 0 && (
                  <span>
                    Intended{" "}
                    <span className="font-medium tabular-nums">
                      {formatCurrency2(receipts[0].retail)}
                    </span>
                  </span>
                )}
              </div>
            )}
          </Block>

          {isCurrent && !prices.loading && (
            <Block
              {...fold("transactions")}
              // Two kinds of the same thing, named as such. "Price points" and
              // "Transactions" read as unrelated sections, which is how one got
              // mistaken for the other — the difference is where the price came
              // from, not what it is.
              label="Price points (transactions)"
              // No note. "3 total" under a price-points heading read as three
              // price points; the grid now says how many units and how many
              // receipts per price, which is what the total was reaching for.
            >
              {txnCount === 0 ? (
                <div className="text-[12px] text-content">No lines matched</div>
              ) : (
                <>
                  <Head
                    cols={[
                      mergedPrices[0]?.weighed ? "Price / lb" : "Price",
                      mergedPrices[0]?.weighed ? "Lb" : "Qty",
                      "Transactions",
                    ]}
                    template={TXN_COLS}
                  />
                  {(isAll("transactions")
                    ? mergedPrices
                    : mergedPrices.slice(0, 5)
                  ).map((p) => (
                    <Line
                      key={p.price}
                      template={TXN_COLS}
                      onClick={() => {
                        setOpenPrice(p.price);
                        onOpenPrice();
                      }}
                      cells={[
                        { text: formatCurrency2(p.price) },
                        {
                          text: p.weighed
                            ? p.qty.toFixed(2)
                            : String(Math.round(p.qty)),
                        },
                        { text: String(p.receipts) },
                      ]}
                    />
                  ))}
                  {mergedPrices.length > 5 && (
                    <ShowAll
                      total={mergedPrices.length}
                      expanded={isAll("transactions")}
                      onToggle={() => toggleAll("transactions")}
                    />
                  )}
                </>
              )}
            </Block>
          )}
          {isCurrent && prices.loading && (
            <Block
              {...fold("transactions")}
              label="Price points (transactions)"
            >
              <div className="text-[12px] text-content">Reading…</div>
            </Block>
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
