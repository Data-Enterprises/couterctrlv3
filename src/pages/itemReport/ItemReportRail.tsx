import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setItemReportExpandedReceipt,
  openItemReportInvoice,
  toggleItemReportSection,
} from "../../features/itemReportSlice";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import InfoButton from "../../components/InfoButton";
import InfoPopover from "../../components/InfoPopover";
import { ITEM_REPORT_RAIL_INFO } from "./itemReportRailInfo";
import { formatCurrency2, formatDateSimple } from "../../utils";
import { formatPct, pillClass } from "../../utils/severity";
import { actualPricePoints } from "../inventory/pricePoints";
import type { ActualFetchState } from "../inventory/useActualPricePoints";
import {
  ACTION_LABEL,
  buildPriceEras,
  daysSince,
  type ActionKind,
  type ReportItem,
} from "./itemReportMetrics";
import { ACTION_TONE } from "./actionTone";
import { describeReceipt } from "./itemReportData";
import type { ReceiptLine } from "./itemReportData";
import TransactionSheet from "./TransactionSheet";

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

/** How far a unit swing has to go before the pill calls it critical rather than
 *  watch. Sales' own delta pill is binary red/green, which would paint a 2% dip
 *  as a crisis — the false alarm this page is built to avoid. */
const DELTA_THRESHOLD = 10;

/** Shown in the Unit movement heading before receipts land, so the section
 *  names its own window rather than appearing to cover all time. */
const MOVEMENT_FALLBACK = 14;

export interface PeriodLabels {
  tw: string;
  lw: string;
  ly: string;
}

interface Props {
  item: ReportItem | null;
  receipts: ReceiptLine[];
  receivingComplete: boolean;
  lookbackDays: number;
  periods: PeriodLabels;
  actual: ActualFetchState;
  /** The selected item's suggested action, carried through to the basket view
   *  so its line there matches its chip on the sheet. */
  action?: ActionKind;
  /** The sentence behind that action. It reads here rather than under every row
   *  in the list, where it broke the columns apart. */
  evidence?: string;
}

const fmtUnits = (n: number | null) =>
  n === null ? "—" : n % 1 === 0 ? String(n) : n.toFixed(1);

/** One period cell, matching the KPI strip on Sales: label, the dates it
 *  covers, then the figure — with the comparison pill inline on the two
 *  baselines. */
const Kpi = ({
  label,
  dates,
  units,
  pct,
}: {
  label: string;
  dates: string;
  units: number | null;
  pct?: number | null;
}) => (
  <div className="px-4 pt-2.5 pb-1.5 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[10px] font-bold text-content mb-0.5">{dates}</div>
    <div className="flex items-baseline justify-center gap-2">
      <span className="text-[14px] font-bold text-content tabular-nums">
        {fmtUnits(units)}
      </span>
      {pct !== undefined && (
        <span
          className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(pct ?? null, DELTA_THRESHOLD)}`}
        >
          {pct === null || pct === undefined ? "—" : formatPct(pct)}
        </span>
      )}
    </div>
  </div>
);

/**
 * One section of the rail.
 *
 * Sections divide on navy at 15% rather than a grey hairline — the same colour
 * the panel headers use, so the rail reads as one panel instead of a stack of
 * unrelated cards.
 */
const Block = ({
  // `id` arrives via the spread and is only there so the caller can key the
  // fold; the component itself has no use for it.
  label,
  note,
  noteTone = "text-content",
  collapsed,
  onToggle,
  children,
}: {
  /** Stable across renders, unlike `label` — two of these interpolate a day
   *  count into their heading, and a key that changes would lose the fold. */
  id: string;
  label: string;
  /** Sits opposite the label. For a fact qualifying the whole section — how
   *  stale the deliveries are, say — which belongs with the heading rather than
   *  dangling under a list it isn't a row of. */
  note?: string;
  noteTone?: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="px-3 py-2.5 border-b border-[#1e2a4a]/15">
    {/* The whole heading is the hit area, not just the chevron — a 12px target
        in a panel this narrow is a miss waiting to happen. */}
    <div
      onClick={onToggle}
      className={`flex items-center justify-between gap-2 cursor-pointer select-none ${
        collapsed ? "" : "mb-1.5"
      }`}
    >
      <span className="flex items-center gap-1 min-w-0">
        {collapsed ? (
          <ChevronRightIcon className="w-3.5 h-3.5 text-content flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5 text-content flex-shrink-0" />
        )}
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-content truncate">
          {label}
        </span>
      </span>
      {note && (
        <span
          className={`text-[12px] font-medium tabular-nums flex-shrink-0 ${noteTone}`}
        >
          {note}
        </span>
      )}
    </div>
    {!collapsed && children}
  </div>
);

/**
 * The grid every section's rows sit on.
 *
 * Real columns rather than "24 · $3.11" crammed into one, and sized to the
 * number of values a section actually has — a two-value section uses a
 * two-track template so its figures finish flush at the right edge instead of
 * stopping short against an empty third column.
 */
/** The transactions grid's own shape. "TRANSACTIONS" is a long heading and the
 *  shared three-column template is sized for the estimated section's "Days". */
const TXN_COLS = "1fr 52px 104px";

const TEMPLATE: Record<number, string> = {
  2: "1fr 76px",
  3: "1fr 60px 76px",
  5: "1fr 44px 58px 58px 50px",
};

interface Cell {
  text: string;
  tone?: string;
}

/**
 * One delivery, opened up.
 *
 * Everything here is already on the line we keep, so opening a row costs nothing
 * — no fetch, no second call. The collapsed grid answers "what arrived and at
 * what price"; this answers "which invoice, how was it billed, and was any of it
 * free or returned".
 *
 * Vendor is a heading rather than a tile: it is a name of unpredictable length,
 * and a tile is a shape for a number.
 */
const ReceiptDetail = ({ line }: { line: ReceiptLine }) => {
  const dispatch = useAppDispatch();

  return (
    <div className="bg-gray-50 border-l-2 border-[#1e2a4a]">
      <div className="px-2.5 py-1.5 text-[12px] font-medium text-content truncate">
        {line.vendorName}
      </div>
      <Kpis
        cells={[
          {
            label: "Invoice",
            value: String(line.invoiceId),
            // The invoice number is already the identity of the thing you would
            // open, so it is the button — no extra control to explain.
            onClick: () =>
              dispatch(
                openItemReportInvoice({
                  invoiceId: line.invoiceId,
                  date: line.date,
                  vendorName: line.vendorName,
                  fromUpc: line.productCode,
                }),
              ),
          },
          {
            label: "Ext cost",
            value: formatCurrency2(line.sellingUnits * line.unitCost),
          },
          {
            label: "Ext retail",
            value:
              line.retail > 0
                ? formatCurrency2(line.sellingUnits * line.retail)
                : "—",
          },
        ]}
      />
      <Kpis
        cells={[
          {
            label: "Received as",
            value: describeReceipt(line.sellingUnits, line.cases),
          },
          // Flags, not counts — a line is free goods or it isn't. "Yes" takes
          // the watch tone so the exception is what draws the eye; "No" stays
          // quiet, which is the answer on almost every delivery.
          {
            label: "Free",
            value: line.free > 0 ? "Yes" : "No",
            flagged: line.free > 0,
          },
          {
            label: "Returned",
            value: line.returned > 0 ? "Yes" : "No",
            flagged: line.returned > 0,
          },
        ]}
      />
    </div>
  );
};

/** Three equal tiles, on the KPI strip the rest of the app uses so a nested
 *  strip still reads as native — with one deliberate variation: the values are
 *  `font-medium`, not the canonical `font-bold`. This strip sits inside a row
 *  that is itself inside a section, and bold at that depth competes with the
 *  headline figures above it. Not drift; leave it. */
const Kpis = ({
  cells,
}: {
  cells: {
    label: string;
    value: string;
    flagged?: boolean;
    onClick?: () => void;
  }[];
}) => (
  <div className="grid grid-cols-3 divide-x divide-[#1e2a4a]/15 border-t border-[#1e2a4a]/15">
    {cells.map((c) => (
      <div
        key={c.label}
        onClick={c.onClick}
        className={`px-2 py-1.5 text-center min-w-0 ${
          c.onClick ? "cursor-pointer hover:bg-[#1e2a4a]/[0.06]" : ""
        }`}
      >
        <div className="text-[10px] font-bold uppercase tracking-wide text-content">
          {c.label}
        </div>
        <div
          className={`text-[12px] font-medium truncate ${
            c.flagged
              ? "text-severity_watch_text"
              : c.onClick
                ? "text-[#1e2a4a] underline underline-offset-2"
                : "text-content"
          }`}
        >
          {c.value}
        </div>
      </div>
    ))}
  </div>
);

const Head = ({ cols, template }: { cols: string[]; template?: string }) => (
  <div
    className="grid gap-2.5 pl-1 py-1.5 border-b border-gray-100 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
    style={{ gridTemplateColumns: template ?? TEMPLATE[cols.length] }}
  >
    {cols.map((c, i) => (
      <span key={c} className={i === 0 ? "" : "text-right"}>
        {c}
      </span>
    ))}
  </div>
);

/**
 * The foot of a section that is showing less than it holds.
 *
 * The label carries the count, so it discloses that there is more as well as
 * offering it — a section that silently stopped at six was the same shape of
 * problem as a query that silently stopped at one page.
 *
 * Expands in place rather than scrolling inside a fixed height: the rail is
 * already one scroll container, and a second one inside it captures the wheel
 * and hides the sections below. Now that every section folds, the height this
 * costs is the reader's to reclaim.
 */
const ShowAll = ({
  total,
  expanded,
  onToggle,
}: {
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="mt-1 pl-1 text-[12px] font-medium text-[#1e2a4a] underline underline-offset-2 hover:opacity-75 transition-opacity"
  >
    {expanded ? "Show fewer" : `Show all ${total}`}
  </button>
);

const Line = ({
  cells,
  zebra,
  onClick,
  template,
}: {
  cells: Cell[];
  /** Overrides the width-by-count default. Two three-column sections want
   *  different shapes, and widening the shared template for one would silently
   *  reflow the other. */
  template?: string;
  /** Explicit rather than `even:` — the delivery rows interleave expansion
   *  strips, and a CSS nth-child rule would restripe everything below an open
   *  one. */
  zebra?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`grid gap-2.5 pl-1 py-1.5 text-[12px] items-center ${
      zebra === undefined ? "even:bg-row_stripe" : zebra ? "bg-row_stripe" : ""
    } ${onClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
    style={{ gridTemplateColumns: template ?? TEMPLATE[cells.length] }}
  >
    {cells.map((c, i) => (
      <span
        key={i}
        className={`tabular-nums ${
          i === 0
            ? "text-content truncate"
            : `text-right font-medium ${c.tone ?? "text-content"}`
        }`}
      >
        {c.text}
      </span>
    ))}
  </div>
);

const ItemReportRail = ({
  item,
  receipts,
  receivingComplete,
  lookbackDays,
  periods,
  actual,
  action,
  evidence,
}: Props) => {
  const dispatch = useAppDispatch();
  const expandedReceipt = useAppSelector((s) => s.itemReport.expandedReceipt);
  /** Which price row is open, or null. Local: a transient overlay over one
   *  selected item that closes on its own — the route-change argument that put
   *  the rest of this page in Redux doesn't apply. */
  const [openPrice, setOpenPrice] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
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

  const collapsed = useAppSelector((s) => s.itemReport.collapsedSections);
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
  const isCurrent = !!item && actual.upc === item.productCode;
  const act = useMemo(
    () => actualPricePoints(isCurrent ? actual.lines : [], item?.unitCost ?? 0),
    [isCurrent, actual.lines, item],
  );

  /**
   * Price points merged by price alone.
   *
   * `actualPricePoints` splits on price *and* price type, which is right for
   * Price Opt — it cares whether a price was promotional. Here it produced two
   * rows both reading "$10.99" with no way to tell them apart, and a count that
   * disagreed with the modal behind it. These are price points based on
   * transactions: what the item rang at is the whole question, and why it rang
   * there is a column this section doesn't have.
   *
   * Merged locally rather than in `actualPricePoints`, which Price Opt shares.
   */
  const mergedPrices = useMemo(() => {
    const byPrice = new Map<
      number,
      { price: number; qty: number; sales: Set<string> }
    >();
    for (const p of act.exact) {
      const found = byPrice.get(p.price);
      if (found) found.qty += p.qty;
      else
        byPrice.set(p.price, { price: p.price, qty: p.qty, sales: new Set() });
    }
    // Distinct receipts per price, counted from the raw lines with the same
    // match the modal uses — so the column and the modal it opens agree. A
    // receipt carrying the item twice is one transaction, not two, which is
    // exactly what the old line count got wrong.
    for (const l of isCurrent ? actual.lines : []) {
      for (const bucket of byPrice.values())
        if (Math.abs(l.net_sales - bucket.price) < 0.005)
          bucket.sales.add(l.sale_id);
    }
    return [...byPrice.values()].sort((a, b) => b.qty - a.qty);
  }, [act.exact, isCurrent, actual.lines]);

  /**
   * How often this item normally arrives, across every delivery in the lookback
   * — not just the handful on screen.
   *
   * This replaced a per-row gap. "Last received 24 days ago" is a fact; paired
   * with "usually every 9" it becomes a decision, and one figure in the heading
   * says that better than a dozen unlabelled annotations down the rows, each of
   * which needed explaining.
   */
  const avgGap = useMemo(() => {
    if (receipts.length < 2) return null;
    const day = (d: string) =>
      new Date(`${d.split("T")[0]}T12:00:00`).getTime() / 86400000;
    // Newest first, so each gap is this delivery less the one before it.
    let total = 0;
    for (let i = 0; i < receipts.length - 1; i++)
      total += day(receipts[i].date) - day(receipts[i + 1].date);
    return Math.max(1, Math.round(total / (receipts.length - 1)));
  }, [receipts]);

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

  const txnCount = act.exactCount + act.averagedCount;

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "38%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 bg-[#1e2a4a] rounded-t-xl flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-custom-white leading-tight">
              {item.description}
            </div>
            <div className="text-[12px] mt-0.5 text-custom-white/85 truncate">
              {item.productCode}
            </div>
          </div>
          {/* This panel gets its own glossary rather than sharing the list's.
              The sections here — estimated prices against actual registers,
              how a vendor billed a delivery, what the two modals show — are
              things the left panel's "?" was explaining from across the page,
              or not at all. */}
          <div className="relative flex-shrink-0">
            <InfoButton onClick={() => setInfoOpen((prev) => !prev)} />
            {infoOpen && (
              <InfoPopover
                title={ITEM_REPORT_RAIL_INFO.title}
                purpose={ITEM_REPORT_RAIL_INFO.purpose}
                glossary={ITEM_REPORT_RAIL_INFO.glossary}
                onClose={() => setInfoOpen(false)}
                className="min-w-[300px] max-w-[520px]"
              />
            )}
          </div>
        </div>

        {/* The conclusion, before any of the figures behind it — the order the
            UPC Workbook's detail panels use.
            
            Built on `ACTION_TONE` rather than the shared `CtaInsightStrip`: that
            component's vocabulary is direction (up / down / flat), and six
            actions can't map onto three without collapsing the blue and violet
            distinctions the chips already carry. Reusing it would have made the
            strip disagree with the chip that opened it. */}
        {action && evidence && (
          <div
            className={`flex-shrink-0 px-4 py-2.5 border-b border-[#1e2a4a]/15 ${ACTION_TONE[action].row}`}
          >
            <div
              className={`text-[11px] font-bold uppercase tracking-wide ${ACTION_TONE[action].text}`}
            >
              {ACTION_LABEL[action]}
            </div>
            <div
              className={`text-[13px] leading-relaxed mt-0.5 ${ACTION_TONE[action].text}`}
            >
              {evidence}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
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

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          <Block
            {...fold("received")}
            label={`Received (${lookbackDays} days)`}
            note={
              lastDays === null
                ? undefined
                : // Reads as a sentence rather than two abbreviations: "every
                  // 8" had no unit at all, and "16d ago" never said ago from
                  // what. The second figure inherits "days" from the first.
                  `Last received ${lastDays} days ago${
                    avgGap === null ? "" : ` · usually every ${avgGap}`
                  }`
            }
            noteTone={(lastDays ?? 0) > 21 ? "text-red-700" : "text-content"}
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
                            { text: String(r.sellingUnits) },
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

          <Block {...fold("prices")} label="Price points (estimated)">
            {eras.length === 0 ? (
              <div className="text-[12px] text-content">No sales rows</div>
            ) : (
              <Head cols={["Price", "Units", "Days"]} />
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

          {isCurrent && !actual.loading && (
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
                    cols={["Price", "Qty", "Transactions"]}
                    template={TXN_COLS}
                  />
                  {(isAll("transactions")
                    ? mergedPrices
                    : mergedPrices.slice(0, 5)
                  ).map((p) => (
                    <Line
                      key={p.price}
                      template={TXN_COLS}
                      onClick={() => setOpenPrice(p.price)}
                      cells={[
                        { text: formatCurrency2(p.price) },
                        { text: String(p.qty) },
                        { text: String(p.sales.size) },
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
          {isCurrent && actual.loading && (
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
          // `exact` points are single-unit rings, so a line at this price is
          // one whose net sale *is* the price.
          lines={actual.lines.filter(
            (l) => Math.abs(l.net_sales - openPrice) < 0.005,
          )}
          onClose={() => setOpenPrice(null)}
        />
      )}
    </div>
  );
};

export default ItemReportRail;
