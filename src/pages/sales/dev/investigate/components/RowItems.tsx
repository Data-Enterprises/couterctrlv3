// Utils
import { ROW_ORDER, rowTab } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow, RowKind } from "../interfaces";

// Components
import Carousel from "./Carousel";
import RowSlide from "./RowSlide";

interface RowItemsProps {
  rows: HoldsRow[];
  us: string;
  them: string;
  fmt: (v: number) => string;
  cash: (v: number) => string;
  selected: RowKind;
  onSelect: (kind: RowKind) => void;
  onPickItem: (code: string) => void;
  onSeeAll: () => void;
}

/** The Summary's items card: one slide per row, on the row picked beside it.
 *  Its own tabs and arrows pick the row too, so the two cards always agree. */
const RowItems = ({
  rows,
  us,
  them,
  fmt,
  cash,
  selected,
  onSelect,
  onPickItem,
  onSeeAll,
}: RowItemsProps) => (
  <Carousel
    at={ROW_ORDER.indexOf(selected)}
    onAt={(i) => onSelect(ROW_ORDER[i])}
    slides={rows.map((row) => ({
      label: rowTab(row.kind, us, them),
      count: row.items.length,
      body: (
        <RowSlide
          row={row}
          us={us}
          them={them}
          fmt={fmt}
          cash={cash}
          onPickItem={onPickItem}
          onSeeAll={onSeeAll}
        />
      ),
    }))}
  />
);

export default RowItems;
