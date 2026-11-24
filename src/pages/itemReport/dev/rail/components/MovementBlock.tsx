// Utils
import { MOVEMENT_FALLBACK } from "../utils";

// Interfaces
import type { ReportItem } from "../../interfaces";
import type { Fold } from "../interfaces";

// Components
import Block from "./Block";
import Kpis from "./Kpis";

interface MovementBlockProps {
  fold: Fold;
  movement: ReportItem["movement"];
}

/** Units received against units sold over the window, and the change between
 *  them. A change in stock, not a count. */
const MovementBlock = ({ fold, movement }: MovementBlockProps) => (
  <Block
    {...fold}
    label={`Unit movement (${movement?.days ?? MOVEMENT_FALLBACK} days)`}
  >
    {movement === null ? (
      <div className="text-[12px] text-content">Nothing received or sold</div>
    ) : (
      <>
        {/* Tiles rather than a two-row grid: Received/Sold/Change is
            arithmetic, not data, and a table made the thinnest possible
            list out of three related figures. */}
        <Kpis
          cells={[
            { label: "Received", value: String(movement.received) },
            { label: "Sold", value: String(movement.sold) },
            {
              // The answer of the three, so it carries the tone —
              // positive means the shelf filled faster than it sold,
              // which is stock that should be findable and may not
              // be.
              label: "Change",
              value: `${movement.net > 0 ? "+" : ""}${movement.net}`,
              flagged: movement.net > 0,
            },
          ]}
        />
        <div className="text-[12px] text-content mt-1.5 leading-snug">
          A change in stock, not a count — there is no opening balance in the
          data.
        </div>
      </>
    )}
  </Block>
);

export default MovementBlock;
