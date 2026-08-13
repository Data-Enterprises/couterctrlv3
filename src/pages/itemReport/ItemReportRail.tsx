import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setItemReportExpandedReceipt,
  openItemReportInvoice,
  toggleItemReportSection,
} from "../../features/itemReportSlice";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatDateSimple } from "../../utils";
import { formatPct, pillClass } from "../../utils/severity";
import { actualPricePoints } from "../inventory/pricePoints";
import type { ActualFetchState } from "../inventory/useActualPricePoints";
import {
  buildPriceEras,
  daysSince,
  type ActionKind,
  type ReportItem,
} from "./itemReportMetrics";
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

const Head = ({ cols }: { cols: string[] }) => (
  <div
    className="grid gap-2.5 pl-1 py-1.5 border-b border-gray-100 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
    style={{ gridTemplateColumns: TEMPLATE[cols.length] }}
  >
    {cols.map((c, i) => (
      <span key={c} className={i === 0 ? "" : "text-right"}>
        {c}
      </span>
    ))}
  </div>
);

const Line = ({
  cells,
  zebra,
  onClick,
}: {
  cells: Cell[];
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
    style={{ gridTemplateColumns: TEMPLATE[cells.length] }}
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
}: Props) => {
  const dispatch = useAppDispatch();
  const expandedReceipt = useAppSelector((s) => s.itemReport.expandedReceipt);
  /** Which price row is open, or null. Local: a transient overlay over one
   *  selected item that closes on its own — the route-change argument that put
   *  the rest of this page in Redux doesn't apply. */
  const [openPrice, setOpenPrice] = useState<number | null>(null);

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
  const txnCount = act.exactCount + act.averagedCount;

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
    const byPrice = new Map<number, { price: number; trans: number }>();
    for (const p of act.exact) {
      const found = byPrice.get(p.price);
      if (found) found.trans += p.trans;
      else byPrice.set(p.price, { price: p.price, trans: p.trans });
    }
    return [...byPrice.values()].sort((a, b) => b.trans - a.trans);
  }, [act.exact]);

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "38%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 bg-[#1e2a4a]">
          <div className="text-[13px] font-semibold text-custom-white leading-tight">
            {item.description}
          </div>
          <div className="text-[12px] mt-0.5 text-custom-white/85 truncate">
            {item.productCode}
          </div>
        </div>

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

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <Block
            {...fold("received")}
            label={`Received (${lookbackDays} days)`}
            note={
              lastDays === null
                ? undefined
                : `Last received ${lastDays} days ago`
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
                {receipts.slice(0, 6).map((r, i) => {
                  const key = `${r.invoiceId}-${r.date}-${r.unitCost}`;
                  const open = expandedReceipt === key;
                  const adjusted = r.free > 0 || r.returned > 0;
                  // Cadence, folded into the date rather than given a column of
                  // its own. "Last received 24 days ago" is a fact; "and it
                  // normally arrives every 9" is what makes it a decision.
                  const prev = receipts[i + 1];
                  const gap = prev
                    ? Math.round(
                        (new Date(
                          `${r.date.split("T")[0]}T12:00:00`,
                        ).getTime() -
                          new Date(
                            `${prev.date.split("T")[0]}T12:00:00`,
                          ).getTime()) /
                          86400000,
                      )
                    : null;
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
                            text: `${open ? "▾" : adjusted ? "•" : "›"} ${formatDateSimple(
                              r.date,
                            )}${gap !== null ? ` · ${gap}d` : ""}`,
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
                })}
              </>
            )}
          </Block>

          {/* The working, not just the result — someone acting on "12 units
              unaccounted for" should be able to see the two figures it came
              from without leaving the report. */}
          <Block
            {...fold("movement")}
            label={`Unit movement (${item.movement?.days ?? MOVEMENT_FALLBACK} days)`}
            note={
              item.movement
                ? `${item.movement.net > 0 ? "+" : ""}${item.movement.net} net`
                : undefined
            }
            noteTone={
              (item.movement?.net ?? 0) > 0 ? "text-amber-700" : "text-content"
            }
          >
            {item.movement === null ? (
              <div className="text-[12px] text-content">
                Nothing received or sold
              </div>
            ) : (
              <>
                <Head cols={["Measure", "Units"]} />
                <Line
                  cells={[
                    { text: "Received" },
                    { text: String(item.movement.received) },
                  ]}
                />
                <Line
                  cells={[
                    { text: "Sold" },
                    { text: String(item.movement.sold) },
                  ]}
                />
                <div className="text-[12px] text-content mt-1.5 leading-snug">
                  A change in stock, not a count — there is no opening balance
                  in the data.
                </div>
              </>
            )}
            {item.sinceDelivery && (
              <div className="mt-2 pt-2 border-t border-[#1e2a4a]/15">
                {/* Anchored to one delivery rather than a span, which is
                    why this one can name what is unaccounted for: there is no
                    opening balance to be ignorant of. The block above measures
                    a fortnight and cannot. */}
                <div className="text-[11.5px] font-medium uppercase tracking-wide text-content mb-1">
                  Since last delivery ·{" "}
                  {formatDateSimple(item.sinceDelivery.date)}
                </div>
                <Line
                  cells={[
                    { text: "Delivered" },
                    { text: String(item.sinceDelivery.received) },
                  ]}
                />
                <Line
                  cells={[
                    { text: "Sold" },
                    { text: String(item.sinceDelivery.sold) },
                  ]}
                />
                <Line
                  cells={[
                    { text: "Unaccounted" },
                    {
                      text: String(item.sinceDelivery.left),
                      tone:
                        item.sinceDelivery.left > 0
                          ? "text-amber-700"
                          : "text-content",
                    },
                  ]}
                />
              </div>
            )}
          </Block>

          <Block {...fold("prices")} label="Price points">
            {eras.length === 0 ? (
              <div className="text-[12px] text-content">No sales rows</div>
            ) : (
              <Head cols={["Price", "Units", "Days"]} />
            )}
            {eras.length > 0 &&
              eras
                .slice(-4)
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
            {/* Cost and intended retail are single reference figures, not
                periods the item sold through. As grid rows they filled two of
                three columns and read as price points that had mislaid their
                units; they belong under the table, as the yardsticks it gets
                read against. */}
            {(item.unitCost !== null || receipts[0]?.retail > 0) && (
              <div className="flex items-baseline gap-3 mt-1.5 text-[12px] text-content">
                {item.unitCost !== null && (
                  <span>
                    Cost{" "}
                    <span className="font-medium tabular-nums">
                      {formatCurrency2(item.unitCost)}
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
              label="Transactions"
              note={txnCount > 0 ? `${txnCount} total` : undefined}
            >
              {txnCount === 0 ? (
                <div className="text-[12px] text-content">No lines matched</div>
              ) : (
                <>
                  <Head cols={["Price", "Count"]} />
                  {mergedPrices.slice(0, 5).map((p) => (
                    <Line
                      key={p.price}
                      onClick={() => setOpenPrice(p.price)}
                      cells={[
                        { text: formatCurrency2(p.price) },
                        { text: String(p.trans) },
                      ]}
                    />
                  ))}
                </>
              )}
            </Block>
          )}
          {isCurrent && actual.loading && (
            <Block {...fold("transactions")} label="Transactions">
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
