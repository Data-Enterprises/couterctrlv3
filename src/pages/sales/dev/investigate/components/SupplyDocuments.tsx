// Utils
import { codeOf } from "../utils";

// Interfaces
import type { OrdersWave, ReceiptsWave } from "../utils/investigationData";
import type { Supply, SupplyRecord } from "../utils/investigationSteps";
import type { AllOrder } from "../../../../../interfaces";
import type { DocLine } from "../interfaces";

// Components
import Document from "./Document";

interface SupplyDocumentsProps {
  supply: Supply;
  cash: (v: number) => string;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** UPCs carried over from the grid, comma or space separated. */
  upcQuery: string;
  onUpcQuery: (v: string) => void;
}

/** The Supply tab's documents: every order and receipt, narrowed by the
 *  pasted UPCs, each opening to its lines. */
const SupplyDocuments = ({
  supply,
  cash,
  orders,
  receipts,
  upcQuery,
  onUpcQuery,
}: SupplyDocumentsProps) => {
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
      code: codeOf(o.product_code),
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
          code: codeOf(l.product_code),
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
  const states = [
    ...new Set(supply.orders.map((o) => o.status).filter(Boolean)),
  ];

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className="text-[18px] font-semibold leading-snug text-content min-w-0">
          {supply.orders.length}{" "}
          {supply.orders.length === 1 ? "order" : "orders"}
          {states.length === 1
            ? `, all still ${states[0]!.toLowerCase()}`
            : ""}
          {supply.deliveries.length === 0 && receipts.ok
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
        <p className="text-[12px] text-content/95 mt-1.5">
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

      <div className="text-[11px] font-bold uppercase tracking-wide text-content/95 mt-4">
        Ordered
      </div>
      <div
        className="grid gap-3 mt-1 pb-1.5 border-b border-brand_navy/15 text-[11px] font-bold uppercase tracking-wide text-content/95"
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
              orders.ok ? "text-content/95" : "text-severity_watch_text"
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
                  : `${orders.inWindow.toLocaleString("en-US")} order lines came back for these two stores over the window and none of them is in this department — by product code or by the department the order itself names. Nothing here can say an item was never ordered, so those items are listed as not carried instead.`}
          </p>
        )}
      </div>

      {supply.deliveries.length > 0 && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wide text-content/95 mt-4">
            Received
          </div>
          {/* Its own headings. These rows carry an INVOICE and its COST,
              and they were being read under the orders' Order and Status
              columns above — which is a dollar amount sitting under the
              word Status. */}
          <div
            className="grid gap-3 mt-1 pb-1.5 border-b border-brand_navy/15 text-[11px] font-bold uppercase tracking-wide text-content/95"
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
          <div className="text-[11px] font-bold uppercase tracking-wide text-content/95">
            Received &middot; 0
          </div>
          <p className="text-[12.5px] text-content/95 leading-snug mt-0.5">
            {receipts.ok
              ? "No invoice carried an item from this department, at either store."
              : "We couldn’t get the receipts information at this time."}
          </p>
        </div>
      )}
    </div>
  );
};

export default SupplyDocuments;
