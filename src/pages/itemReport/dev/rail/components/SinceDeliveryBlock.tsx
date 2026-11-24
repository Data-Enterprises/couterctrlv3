// Utils
import { formatDateSimple } from "../../../../../utils";

// Interfaces
import type { ReportItem } from "../../interfaces";
import type { Fold } from "../interfaces";

// Components
import Block from "./Block";
import Kpis from "./Kpis";

interface SinceDeliveryBlockProps {
  fold: Fold;
  since: NonNullable<ReportItem["sinceDelivery"]>;
}

/** What was delivered last time, what has sold since, and what is left. */
const SinceDeliveryBlock = ({ fold, since }: SinceDeliveryBlockProps) => (
  <Block
    {...fold}
    label={`Since last delivery · ${formatDateSimple(since.date)}`}
  >
    <Kpis
      cells={[
        { label: "Delivered", value: String(since.received) },
        { label: "Sold", value: String(since.sold) },
        {
          // Left neutral on purpose. "Unaccounted" read as a
          // shortfall — stock that has gone missing — when a positive
          // figure here is the ordinary case: units still on the
          // shelf.
          label: "Left over",
          value: String(since.left),
        },
      ]}
    />
  </Block>
);

export default SinceDeliveryBlock;
