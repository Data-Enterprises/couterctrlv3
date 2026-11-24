// Utils
import { SUPPLY_ORDER } from "../utils/supplyRows";
import {
  documentLines,
  matchesCodes,
  plural,
  supplySlides,
  wantedCodes,
} from "../utils/documents";

// Interfaces
import type { OrdersWave, ReceiptsWave } from "../../utils/investigationData";
import type { Supply } from "../../utils/investigationSteps";
import type { SupplyKind, SupplyRow } from "../../interfaces";

// Components
import Carousel from "../../../components/Carousel";
import SupplySlide from "./SupplySlide";
import UpcFilter from "./UpcFilter";

interface SupplyDocumentsProps {
  supply: Supply;
  rows: SupplyRow[];
  /** The two stores' numbers, as the rows and tabs print them. */
  us: string;
  them: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** UPCs carried over from the grid, comma or space separated. */
  upcQuery: string;
  onUpcQuery: (v: string) => void;
  selected: SupplyKind;
  onSelect: (kind: SupplyKind) => void;
}

/** The Supply tab's documents card: one slide per row, on the row picked
 *  beside it, every list narrowed by the pasted UPCs. Its own tabs pick the
 *  row back, so the two cards always agree. */
const SupplyDocuments = ({
  supply,
  rows,
  us,
  them,
  window,
  cash,
  orders,
  receipts,
  upcQuery,
  onUpcQuery,
  selected,
  onSelect,
}: SupplyDocumentsProps) => {
  const wanted = wantedCodes(upcQuery);
  const lines = documentLines(orders, receipts);
  const matches = matchesCodes(wanted, lines);

  const shownOrders = supply.orders.filter((r) => matches(r, true));
  const shownDeliveries = supply.deliveries.filter((r) => matches(r, false));

  const slides = supplySlides({
    rows,
    us,
    them,
    window,
    supply,
    orders,
    receipts,
    cash,
    matches,
  }).map((s) => ({
    label: s.label,
    count: s.count,
    body: (
      <SupplySlide
        row={s.row}
        shown={s.shown}
        says={s.says}
        note={s.note}
        warn={s.row.isOrder && !orders.ok}
        foot={s.foot}
        linesOf={(r) =>
          s.row.isOrder
            ? lines.orderLines(r.id, r.mine)
            : lines.invoiceLines(r.id, r.mine)
        }
        /* The receipt search asks for the matched lines only, so an invoice
           has no "whole document" to offer. */
        wholeOf={(r) => (s.row.isOrder ? lines.wholeOrder(r.id, r.mine) : null)}
        cash={cash}
      />
    ),
  }));

  return (
    <Carousel
      fill
      helpAnchor="supply-docs"
      at={SUPPLY_ORDER.indexOf(selected)}
      onAt={(i) => onSelect(SUPPLY_ORDER[i])}
      above={
        <UpcFilter
          value={upcQuery}
          onChange={onUpcQuery}
          codes={wanted.size}
          summary={`${plural(wanted.size, "code")} | ${shownOrders.length} of ${plural(supply.orders.length, "order")} and ${shownDeliveries.length} of ${plural(supply.deliveries.length, "receiver")} carry them.`}
        />
      }
      slides={slides}
    />
  );
};

export default SupplyDocuments;
