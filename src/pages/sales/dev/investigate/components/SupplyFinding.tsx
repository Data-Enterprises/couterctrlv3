// Utils
import { onDay } from "../utils";
import { SUPPLY_LOOKBACK_DAYS } from "../utils/investigationData";
import { supplySays, type Supply } from "../utils/investigationSteps";

// Interfaces
import type { SupplyKind, SupplyRow } from "../interfaces";

// Components
import SupplyRowChoice from "./SupplyRowChoice";

interface SupplyFindingProps {
  supply: Supply;
  rows: SupplyRow[];
  /** The two stores' numbers. */
  us: string;
  them: string;
  window: { start: string; end: string };
  ordersOk: boolean;
  receiptsOk: boolean;
  selected: SupplyKind;
  onSelect: (kind: SupplyKind) => void;
}

/** The Supply tab's first card: what each store ordered and received, as a
 *  sentence, a figure and the rows that pick the documents card. */
const SupplyFinding = ({
  supply,
  rows,
  us,
  them,
  window,
  ordersOk,
  receiptsOk,
  selected,
  onSelect,
}: SupplyFindingProps) => {
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const says = supplySays(supply, us, them, receiptsOk);
  const orderedTotal = supply.mine.orderedUnits + supply.theirs.orderedUnits;
  const states = [
    ...new Set(supply.orders.map((o) => o.status).filter(Boolean)),
  ];

  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0 flex flex-col gap-3.5">
      <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2.5">
        <p className="text-[17px] font-semibold leading-snug text-content">
          {says.lead}
        </p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[32px] font-bold tabular-nums leading-none text-content">
            {n(supply.mine.orderedUnits)}
          </span>
          <span className="text-[13.5px] text-content/95 min-w-0">
            units ordered at {us}, against{" "}
            <span className="font-semibold text-content">
              {n(supply.theirs.orderedUnits)}
            </span>{" "}
            at {them}
          </span>
        </div>
      </div>

      {orderedTotal > 0 && (
        <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-bkg">
          <span
            className="block bg-store_open"
            style={{ width: `${(supply.mine.orderedUnits / orderedTotal) * 100}%` }}
          />
          <span
            className="block bg-store_compare"
            style={{ width: `${(supply.theirs.orderedUnits / orderedTotal) * 100}%` }}
          />
        </span>
      )}

      <div className="flex flex-col gap-0.5">
        {rows.map((r) => (
          <SupplyRowChoice
            key={r.kind}
            row={r}
            us={us}
            them={them}
            read={r.isOrder ? ordersOk : receiptsOk}
            on={r.kind === selected}
            onPick={() => onSelect(r.kind)}
          />
        ))}
      </div>

      {/* The window is the one fact the rows need: it is not the sales week. */}
      <p className="text-[12.5px] text-brand_slate">
        Read over {SUPPLY_LOOKBACK_DAYS} days, {onDay(window.start)} – {onDay(window.end)}
        {states.length === 1 && supply.orders.length > 0
          ? supply.orders.length === 1
            ? ` | The order is ${String(states[0]).toLowerCase()}`
            : ` | All ${supply.orders.length} orders ${String(states[0]).toLowerCase()}`
          : ""}
      </p>
    </div>
  );
};

export default SupplyFinding;
