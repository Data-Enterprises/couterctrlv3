// Utils
import { formatCurrency2 } from "../../../../../utils";
import { fmtUnits } from "../utils";

// Interfaces
import type { ReceiptLine } from "../../interfaces";
import type { buildPriceEras } from "../../utils/priceEras";
import type { Fold } from "../interfaces";

// Components
import Block from "./Block";
import Head from "./Head";
import Line from "./Line";
import ShowAll from "./ShowAll";

interface PricePointsBlockProps {
  fold: Fold;
  eras: ReturnType<typeof buildPriceEras>;
  /** The latest delivery, for the cost and intended retail under the table. */
  last: ReceiptLine | null;
  /** Every price period shown, not just the latest four. */
  expanded: boolean;
  onToggleAll: () => void;
}

/** The prices the item held over the window, newest first, with the last
 *  invoice's cost and intended retail as the yardsticks underneath. */
const PricePointsBlock = ({
  fold,
  eras,
  last,
  expanded,
  onToggleAll,
}: PricePointsBlockProps) => (
  <Block {...fold} label="Price points">
    {eras.length === 0 ? (
      <div className="text-[12px] text-content">No sales rows</div>
    ) : (
      // Named, not left as "Units". On a weighed item the figure is
      // pounds and the price is per pound, which is what the
      // transactions table below already says (finding AS).
      <Head
        cols={
          eras[0]?.weighed
            ? ["Price / lb", "Lb", "Days"]
            : ["Price", "Units", "Days"]
        }
      />
    )}
    {eras.length > 0 &&
      (expanded ? [...eras] : eras.slice(-4))
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
      <ShowAll total={eras.length} expanded={expanded} onToggle={onToggleAll} />
    )}
    {/* The receiver's cost, not the sales file's blend, so the strip's
        "below cost at $6.49 against $6.85" and this footer name the same
        invoice. */}
    {last && (last.unitCost > 0 || last.retail > 0) && (
      <div className="flex items-baseline gap-3 mt-1.5 text-[12px] text-content">
        {last.unitCost > 0 && (
          <span>
            Last cost{" "}
            <span className="font-medium tabular-nums">
              {formatCurrency2(last.unitCost)}
            </span>
          </span>
        )}
        {last.retail > 0 && (
          <span>
            Intended{" "}
            <span className="font-medium tabular-nums">
              {formatCurrency2(last.retail)}
            </span>
          </span>
        )}
      </div>
    )}
  </Block>
);

export default PricePointsBlock;
