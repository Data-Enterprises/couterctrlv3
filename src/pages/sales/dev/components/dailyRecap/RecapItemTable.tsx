import { avgPrice } from "./recapItems";
import { count, money, pounds } from "./recapFormat";
import { HEAD, ITEM_ROW, NOTE, NUM, itemCols } from "./recapGrid";
import type { RecapItem } from "./recapTypes";

/**
 * Every item one sub dept sold on one day, biggest sales first.
 *
 * All of them, not a top slice: a recap that quietly stops at twenty would
 * make the reader wonder what the rest were. The list scrolls with the tab.
 *
 * A weighed item's average is per pound and its Units still count rings; the
 * two sit side by side, never one in place of the other.
 */
const RecapItemTable = ({
  items,
  withPounds,
}: {
  items: RecapItem[];
  withPounds: boolean;
}) => {
  const cols = itemCols(withPounds);
  return (
    <div className="pl-8">
      <div className={HEAD} style={{ gridTemplateColumns: cols }}>
        <span>Item</span>
        <span>UPC</span>
        <span className={NUM}>Units</span>
        {withPounds && <span className={NUM}>Pounds</span>}
        <span className={NUM}>Sales</span>
        <span className={NUM}>Avg price</span>
      </div>
      {items.map((item) => {
        const avg = avgPrice(item);
        return (
          <div key={item.code} className={ITEM_ROW} style={{ gridTemplateColumns: cols }}>
            <span className="min-w-0 truncate font-medium" title={item.name}>
              {item.name}
            </span>
            <span className="tabular-nums truncate">{item.code}</span>
            <span className={NUM}>{count(item.units)}</span>
            {withPounds && (
              <span className={NUM}>
                {item.pounds > 0 ? pounds(item.pounds) : "—"}
              </span>
            )}
            <span className={`${NUM} font-semibold`}>{money(item.net)}</span>
            <span className={NUM}>
              {avg === null ? "—" : `${money(avg)}${item.pounds > 0 ? "/lb" : ""}`}
            </span>
          </div>
        );
      })}
      {items.length === 0 && <div className={NOTE}>No items match the search.</div>}
    </div>
  );
};

export default RecapItemTable;
