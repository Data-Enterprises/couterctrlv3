// Hooks
import { Fragment } from "react";

// Interfaces
import type { Supply } from "../utils/investigationSteps";

// Components
import Carousel from "./Carousel";
import Timeline from "./Timeline";

interface SupplyChartsProps {
  supply: Supply;
  them: string;
  us: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
}

/** The Supply tab's charts: the window as a timeline, the two stores side by
 *  side, and the vendors either store took a delivery from. */
const SupplyCharts = ({ supply, them, us, window, cash }: SupplyChartsProps) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");

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
    <Carousel
      fill
      slides={[
        {
          label: "Over the window",
          body: (
            <>
              <p className="text-[12px] text-content/95 leading-snug mb-2.5">
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
              <span className="flex items-center justify-end gap-1.5 min-w-0 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/95">
                <span className="w-2 h-2 rounded-full bg-store_open flex-shrink-0" />
                <span className="min-w-0 truncate normal-case" title={us}>
                  {us}
                </span>
              </span>
              <span className="flex items-center justify-end gap-1.5 min-w-0 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/95">
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
                  <span className="py-1.5 border-b border-brand_navy/15 text-content/95 truncate">
                    {row.label}
                  </span>
                  <span
                    className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                      row.m === 0
                        ? "text-content/95"
                        : "font-bold text-content"
                    }`}
                  >
                    {row.fmt(row.m)}
                  </span>
                  <span
                    className={`text-right tabular-nums py-1.5 border-b border-brand_navy/15 ${
                      row.t === 0
                        ? "text-content/95"
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
                          className={`text-[11.5px] font-bold uppercase tracking-wide text-content/95 pb-1.5 border-b border-brand_navy/15 ${
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
                        <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/95">
                          {r.theirs ? n(r.theirs.units) : "none"}
                        </span>
                        <span className="text-right tabular-nums py-1.5 border-b border-brand_navy/15 text-content/95">
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
  );
};

export default SupplyCharts;
