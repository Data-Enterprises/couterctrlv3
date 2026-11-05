import { Fragment } from "react";
import type { AllOrder } from "../../../../../interfaces";
import {
  SUPPLY_LOOKBACK_DAYS,
  type OrdersWave,
  type ReceiptsWave,
} from "../utils/investigationData";
import {
  supplySays,
  type Supply,
  type SupplyRecord,
} from "../utils/investigationSteps";
import type { DocLine } from "../types";
import Carousel from "./Carousel";
import Timeline from "./Timeline";
import Document from "./Document";

/* ------------------------------------------------------------------ */
/* Supply · the orders and the invoices themselves                     */
/* ------------------------------------------------------------------ */

/**
 * What each store ordered, and what actually turned up.
 *
 * Everywhere else the notebook takes its own word for a cause: an item is
 * labelled never-ordered and the reader is asked to believe there is no
 * order. This is the orders and the invoices, both stores side by side, so
 * the label can be checked rather than trusted.
 */
/**
 * What each store ordered, and what actually turned up.
 *
 * The same shape the Summary tab uses: a verdict card over an evidence
 * carousel on the left, and the list the verdict is about on the right.
 */
const SupplyPanel = ({
  supply,
  them,
  us,
  window,
  cash,
  orders,
  receipts,
  upcQuery,
  onUpcQuery,
}: {
  supply: Supply;
  them: string;
  us: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** UPCs carried over from the grid, comma or space separated. */
  upcQuery: string;
  onUpcQuery: (v: string) => void;
}) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const says = supplySays(supply, us, them);

  /* The codes the reader is asking about, if any. Commas, spaces or new
     lines, because all three are what a paste brings with it. */
  const wanted = new Set(
    upcQuery
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean),
  );

  const asLines = (rows: AllOrder[]): DocLine[] =>
    rows.map((o) => ({
      code: String(o.product_code),
      description: o.description,
      units: o.qty,
      cost: 0,
    }));

  /** An order's lines in this department. */
  const orderLines = (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.mine : orders.theirs).filter((o) => o.order_id === id),
    );

  /** And the same order entire, which came down with the same request. */
  const wholeOrder = (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.allMine : orders.allTheirs).filter(
        (o) => o.order_id === id,
      ),
    );

  const invoiceLines = (id: number, mine: boolean) =>
    (mine ? receipts.mine : receipts.theirs)
      .filter((r) => r.invoiceid === id)
      .flatMap((r) =>
        r.lines.map((l) => ({
          code: String(l.product_code),
          description: l.product_description,
          // `qty` is the selling-unit count on a receiver line, the same
          // field the order side above reads. See the note in vitalsOf.
          units: l.item_return ? -l.qty : l.qty,
          cost: l.ext_cost,
        })),
      );

  /* A document matches when any of its lines carries a code asked for. */
  const matches = (rec: SupplyRecord, isOrder: boolean) =>
    wanted.size === 0 ||
    (isOrder
      ? orderLines(rec.id, rec.mine)
      : invoiceLines(rec.id, rec.mine)
    ).some((l) => wanted.has(l.code));

  const shownOrders = supply.orders.filter((r) => matches(r, true));
  const shownDeliveries = supply.deliveries.filter((r) => matches(r, false));

  const orderedTotal = supply.mine.orderedUnits + supply.theirs.orderedUnits;
  const states = [
    ...new Set(supply.orders.map((o) => o.status).filter(Boolean)),
  ];

  // Every vendor either store took a delivery from, biggest first.
  const names = [
    ...new Set([
      ...supply.mine.vendors.map((v) => v.name),
      ...supply.theirs.vendors.map((v) => v.name),
    ]),
  ];
  const vendorRows = names
    .map((name) => ({
      name,
      mine: supply.mine.vendors.find((v) => v.name === name) ?? null,
      theirs: supply.theirs.vendors.find((v) => v.name === name) ?? null,
    }))
    .sort(
      (x, y) =>
        (y.theirs?.units ?? 0) +
        (y.mine?.units ?? 0) -
        ((x.theirs?.units ?? 0) + (x.mine?.units ?? 0)),
    );

  const sides = [
    {
      label: "Orders placed",
      m: supply.mine.orders,
      t: supply.theirs.orders,
      fmt: n,
    },
    {
      label: "Lines on them",
      m: supply.mine.orderLines,
      t: supply.theirs.orderLines,
      fmt: n,
    },
    {
      label: "Units ordered",
      m: supply.mine.orderedUnits,
      t: supply.theirs.orderedUnits,
      fmt: n,
    },
    {
      // The document count, beside the units and the cost on them. Receipts
      // to the orders above it -- you order, you receive.
      label: "Receipts",
      m: supply.mine.deliveries,
      t: supply.theirs.deliveries,
      fmt: n,
    },
    {
      label: "Units received",
      m: supply.mine.receivedUnits,
      t: supply.theirs.receivedUnits,
      fmt: n,
    },
    {
      label: "Cost received",
      m: supply.mine.receivedCost,
      t: supply.theirs.receivedCost,
      fmt: cash,
    },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5">
      <div
        className="grid gap-5 items-start"
        style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)" }}
      >
        <div className="flex flex-col gap-5 min-w-0">
          <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
            <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2.5">
              <p className="text-[18px] font-semibold leading-snug text-content">
                {says.lead}
              </p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-[34px] font-bold tabular-nums leading-none text-content">
                  {n(supply.mine.orderedUnits)}
                </span>
                <span className="text-[13.5px] text-content/85 min-w-0">
                  units ordered here, against{" "}
                  <span className="font-semibold text-content">
                    {n(supply.theirs.orderedUnits)}
                  </span>{" "}
                  at {them}
                </span>
              </div>
            </div>

            {orderedTotal > 0 && (
              <span className="flex h-[9.2px] rounded-sm overflow-hidden bg-bkg mt-3">
                <span
                  className="block bg-store_open"
                  style={{
                    width: `${(supply.mine.orderedUnits / orderedTotal) * 100}%`,
                  }}
                />
                <span
                  className="block bg-store_compare"
                  style={{
                    width: `${(supply.theirs.orderedUnits / orderedTotal) * 100}%`,
                  }}
                />
              </span>
            )}

            <div className="flex flex-col mt-2">
              {[
                {
                  tone: "bg-store_open",
                  label: `Ordered at ${us}`,
                  count: `${supply.mine.orders} orders`,
                  value: `${n(supply.mine.orderedUnits)} units`,
                },
                {
                  tone: "bg-store_compare",
                  label: `Ordered at ${them}`,
                  count: `${supply.theirs.orders} orders`,
                  value: `${n(supply.theirs.orderedUnits)} units`,
                },
                {
                  tone: "",
                  label: "Received at either store",
                  count: `${supply.mine.deliveries + supply.theirs.deliveries} receipts`,
                  value: cash(
                    supply.mine.receivedCost + supply.theirs.receivedCost,
                  ),
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      r.tone || "border-2 border-content/40"
                    }`}
                  />
                  <span className="text-[13px] text-content/85 min-w-0 truncate">
                    {r.label}
                  </span>
                  <span className="ml-auto text-[12.5px] text-content/85 tabular-nums whitespace-nowrap">
                    {r.count}
                  </span>
                  <span className="w-[104px] text-right text-[13px] font-bold tabular-nums text-content whitespace-nowrap">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[13.5px] text-content/85 leading-relaxed rounded-md bg-bkg px-3.5 py-3 mt-3">
              {states.length === 1 && supply.orders.length > 0 && (
                <>
                  All{" "}
                  <span className="font-semibold text-content">
                    {supply.orders.length} orders
                  </span>{" "}
                  read {states[0]}.{" "}
                </>
              )}
              Read over {SUPPLY_LOOKBACK_DAYS} days ({window.start} to{" "}
              {window.end}), which does not line up with the sales week — so it
              explains this week and says nothing about last week or last year.
              A return is taken back off what arrived.
            </p>
          </div>

          {/* A supplier they buy from and we do not is a buying decision, not
              an accident — and it is the one thing in here somebody can act
              on without opening a single item. */}
          {supply.onlyTheirs.length > 0 && (
            <div className="rounded-lg bg-severity_watch_bg px-5 py-4">
              <p className="text-[14px] leading-relaxed text-severity_watch_text">
                <span className="font-bold">
                  {supply.onlyTheirs.length === 1
                    ? "One vendor delivers to them and not here"
                    : `${supply.onlyTheirs.length} vendors deliver to them and not here`}
                  :
                </span>{" "}
                {supply.onlyTheirs.join(", ")}.
              </p>
            </div>
          )}

          <Carousel
            slides={[
              {
                label: "Over the window",
                body: (
                  <>
                    <p className="text-[12px] text-content/85 leading-snug mb-2.5">
                      Dot size is units ordered. An empty lane means nothing
                      arrived.
                    </p>
                    <Timeline
                      orders={supply.orders}
                      deliveries={supply.deliveries}
                      window={window}
                      us={us}
                      them={them}
                    />
                  </>
                ),
              },
              {
                label: "Side by side",
                body: (
                  <div
                    className="grid gap-x-3 text-[13px]"
                    style={{ gridTemplateColumns: "minmax(0,1fr) 120px 120px" }}
                  >
                    <span className="pb-1.5 border-b border-brand_navy/15" />
                    {/* min-w-0 on the TEXT, not on the flex row around it:
                        justify-end pushes the overflow off the left, so a
                        truncate up here ate the front of the name instead of
                        putting an ellipsis on the end of it. */}
                    <span className="flex items-center justify-end gap-1.5 min-w-0 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/85">
                      <span className="w-2 h-2 rounded-full bg-store_open flex-shrink-0" />
                      <span className="min-w-0 truncate normal-case" title={us}>
                        {us}
                      </span>
                    </span>
                    <span className="flex items-center justify-end gap-1.5 min-w-0 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/85">
                      <span className="w-2 h-2 rounded-full bg-store_compare flex-shrink-0" />
                      <span
                        className="min-w-0 truncate normal-case"
                        title={them}
                      >
                        {them}
                      </span>
                    </span>

                    {sides.map((row) => (
                      <Fragment key={row.label}>
                        <span className="py-1.5 border-b border-brand_navy/15 text-content/85 truncate">
                          {row.label}
                        </span>
                        <span
                          className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                            row.m === 0
                              ? "text-content/85"
                              : "font-bold text-content"
                          }`}
                        >
                          {row.fmt(row.m)}
                        </span>
                        <span
                          className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                            row.t === 0
                              ? "text-content/85"
                              : "font-semibold text-content"
                          }`}
                        >
                          {row.fmt(row.t)}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                ),
              },
              ...(vendorRows.length > 0
                ? [
                    {
                      label: "Vendors",
                      count: vendorRows.length,
                      body: (
                        <div
                          className="grid gap-x-4 text-[12.5px]"
                          style={{
                            gridTemplateColumns: "minmax(0,1fr) 84px 84px 84px",
                          }}
                        >
                          {["Vendor", "Here", "There", "Cost here"].map(
                            (h, i) => (
                              <span
                                key={h}
                                className={`text-[11.5px] font-bold uppercase tracking-wide text-content/85 pb-1.5 border-b border-brand_navy/15 ${
                                  i > 0 ? "text-right" : ""
                                }`}
                              >
                                {h}
                              </span>
                            ),
                          )}
                          {vendorRows.map((r) => (
                            <Fragment key={r.name}>
                              <span className="min-w-0 truncate py-1.5 border-b border-brand_navy/15 text-content">
                                {r.name}
                              </span>
                              <span
                                className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                                  r.mine
                                    ? "font-semibold text-content"
                                    : "text-delta_negative_text"
                                }`}
                              >
                                {r.mine ? n(r.mine.units) : "none"}
                              </span>
                              <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/85">
                                {r.theirs ? n(r.theirs.units) : "none"}
                              </span>
                              <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/85">
                                {r.mine ? cash(r.mine.cost) : "—"}
                              </span>
                            </Fragment>
                          ))}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* The documents themselves, which is what the left column is about. */}
        <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <p className="text-[18px] font-semibold leading-snug text-content min-w-0">
              {supply.orders.length}{" "}
              {supply.orders.length === 1 ? "order" : "orders"}
              {states.length === 1
                ? `, all still ${states[0]!.toLowerCase()}`
                : ""}
              {supply.deliveries.length === 0
                ? " — nothing received against them."
                : "."}
            </p>
          </div>

          {/* Paste the codes from the grid and the lists narrow to the
              documents that carry them. The grid's own right-click menu
              fills this in, so nobody has to retype a UPC to find out
              whether it was ever ordered. */}
          <div className="flex items-center gap-2 mt-2.5">
            <input
              value={upcQuery}
              onChange={(e) => onUpcQuery(e.target.value)}
              placeholder="Paste UPCs to find the orders carrying them"
              className="flex-1 min-w-0 text-[12.5px] px-2.5 py-1.5 rounded-md border border-brand_line bg-custom-white text-content placeholder:text-content/85 focus:outline-none focus:ring-2 focus:ring-brand_navy/25"
            />
            {wanted.size > 0 && (
              <button
                onClick={() => onUpcQuery("")}
                className="flex-shrink-0 text-[12px] font-semibold text-brand_navy_hover hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          {wanted.size > 0 && (
            <p className="text-[12px] text-content/85 mt-1.5">
              {wanted.size} {wanted.size === 1 ? "code" : "codes"} ·{" "}
              {shownOrders.length} of {supply.orders.length}{" "}
              {supply.orders.length === 1 ? "order" : "orders"} and{" "}
              {shownDeliveries.length} of {supply.deliveries.length} carry
              {shownOrders.length + shownDeliveries.length === 1
                ? "s"
                : ""}{" "}
              them.
            </p>
          )}

          <div className="text-[11px] font-bold uppercase tracking-wide text-content/85 mt-4">
            Ordered
          </div>
          <div
            className="grid gap-3 mt-1 pb-1.5 border-b border-brand_navy/15 text-[11px] font-bold uppercase tracking-wide text-content/85"
            style={{
              gridTemplateColumns:
                "62px 16px minmax(0,1fr) 88px minmax(0,110px) 62px 76px",
            }}
          >
            <span>Date</span>
            <span />
            <span>Vendor</span>
            <span>Order</span>
            <span>Status</span>
            <span
              className="text-right"
              title="Lines in this department, not on the whole order"
            >
              Dept lines
            </span>
            <span className="text-right">Units</span>
          </div>

          <div className="mt-0.5">
            {shownOrders.map((r) => (
              <Document
                key={`o${r.mine ? "m" : "t"}-${r.id}`}
                rec={r}
                lines={orderLines(r.id, r.mine)}
                whole={wholeOrder(r.id, r.mine)}
                cash={cash}
                isOrder
              />
            ))}
            {shownOrders.length === 0 && (
              <p
                className={`text-[13px] leading-relaxed py-3 ${
                  orders.ok ? "text-content/85" : "text-severity_watch_text"
                }`}
              >
                {!orders.ok
                  ? "The orders did not come back for this window, so this panel cannot say whether either store ordered. What was received below is unaffected — it is read separately."
                  : supply.orders.length > 0
                    ? "No order in the window carries any of those codes."
                    : orders.inWindow === 0
                      ? supply.deliveries.length > 0
                        ? "No order of any kind came back for either store over the window, and the receipts below arrived anyway — which is what a department delivered straight off the vendor's truck looks like. Nothing here can say an item was never ordered, so those items are listed as not carried instead."
                        : "Neither store placed an order of any kind over the window. That is the finding, not a gap in the data."
                      : `${orders.inWindow.toLocaleString("en-US")} order lines came back for these two stores over the window and none of them is in this department — by product code or by the department the order itself names.`}
              </p>
            )}
          </div>

          {supply.deliveries.length > 0 && (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wide text-content/85 mt-4">
                Received
              </div>
              {/* Its own headings. These rows carry an INVOICE and its COST,
                  and they were being read under the orders' Order and Status
                  columns above — which is a dollar amount sitting under the
                  word Status. */}
              <div
                className="grid gap-3 mt-1 pb-1.5 border-b border-brand_navy/15 text-[11px] font-bold uppercase tracking-wide text-content/85"
                style={{
                  gridTemplateColumns:
                    "62px 16px minmax(0,1fr) 88px minmax(0,110px) 62px 76px",
                }}
              >
                <span>Date</span>
                <span />
                <span>Vendor</span>
                <span>Invoice</span>
                <span>Cost</span>
                <span
                  className="text-right"
                  title="Lines in this department, not on the whole invoice"
                >
                  Dept lines
                </span>
                <span className="text-right">Units</span>
              </div>
              <div className="mt-0.5">
                {shownDeliveries.map((r) => (
                  <Document
                    key={`d${r.mine ? "m" : "t"}-${r.id}`}
                    rec={r}
                    lines={invoiceLines(r.id, r.mine)}
                    /* The receipt search asks for the matched lines only —
                       whole invoices would be several hundred documents'
                       worth of lines nothing reads — so an invoice has no
                       "whole document" to offer. */
                    whole={null}
                    cash={cash}
                    isOrder={false}
                  />
                ))}
              </div>
            </>
          )}

          {supply.deliveries.length === 0 && (
            <div className="rounded-md border border-dashed border-brand_navy/25 px-3.5 py-2.5 mt-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-content/85">
                Received &middot; 0
              </div>
              <p className="text-[12.5px] text-content/85 leading-snug mt-0.5">
                No invoice carried an item from this department, at either
                store.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplyPanel;
