// Utils
import { SUPPLY_LOOKBACK_DAYS } from "../utils/investigationData";
import { supplySays, type Supply } from "../utils/investigationSteps";

interface SupplyFindingProps {
  supply: Supply;
  them: string;
  us: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
}

/** The Supply tab's first card: what each store ordered and received, as a
 *  sentence, a figure and the rows behind it. */
const SupplyFinding = ({ supply, them, us, window, cash }: SupplyFindingProps) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const says = supplySays(supply, us, them);
  const orderedTotal = supply.mine.orderedUnits + supply.theirs.orderedUnits;
  const states = [
    ...new Set(supply.orders.map((o) => o.status).filter(Boolean)),
  ];

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0">
      <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2.5">
        <p className="text-[18px] font-semibold leading-snug text-content">
          {says.lead}
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[34px] font-bold tabular-nums leading-none text-content">
            {n(supply.mine.orderedUnits)}
          </span>
          <span className="text-[13.5px] text-content/95 min-w-0">
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
            <span className="text-[13px] text-content/95 min-w-0 truncate">
              {r.label}
            </span>
            <span className="ml-auto text-[12.5px] text-content/95 tabular-nums whitespace-nowrap">
              {r.count}
            </span>
            <span className="w-[104px] text-right text-[13px] font-bold tabular-nums text-content whitespace-nowrap">
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[13.5px] text-content/95 leading-relaxed rounded-md bg-bkg px-3.5 py-3 mt-3">
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
  );
};

export default SupplyFinding;
