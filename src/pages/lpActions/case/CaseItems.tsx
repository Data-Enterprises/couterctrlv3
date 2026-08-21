import { formatCurrency2 } from "../../../utils";
import {
  GRID_CELL,
  GRID_HEAD,
  GRID_NOTE,
  GRID_NUM,
  GRID_ROW,
} from "./gridTheme";
import type { ItemRow } from "./itemMovement";

/**
 * The items carrying the movement.
 *
 * Only the movers are listed by default. Steady items collapse to a count,
 * because a list of everything is the search result this page exists to
 * replace — but the toggle is there, because "nothing moved" is itself a
 * finding a manager will want to confirm rather than take on trust.
 *
 * On the app's grid theme rather than a bordered card, so it reads as the same
 * kind of object as every other data list in the product.
 */
interface Props {
  items: ItemRow[];
  loading: boolean;
  error: string | null;
  showAll: boolean;
  onToggleAll: () => void;
}

/** Move badge, description, units, amount. */
const COLS = "54px 1fr 34px 62px";

const BADGE: Record<string, string> = {
  new: "bg-severity_critical_bg text-severity_critical_text",
  increased: "bg-severity_watch_bg text-severity_watch_text",
  stopped: "bg-gray-100 text-content",
};

const Note = ({ text }: { text: string }) => (
  <div className={GRID_NOTE}>{text}</div>
);

const CaseItems = ({ items, loading, error, showAll, onToggleAll }: Props) => {
  const movers = items.filter((i) => i.move !== "steady");
  const steady = items.length - movers.length;
  const shown = showAll ? items : movers.slice(0, 4);

  if (loading) return <Note text="Reading the receipts…" />;
  if (error) return <Note text={error} />;
  if (items.length === 0)
    return <Note text="No items came back on these receipts." />;

  return (
    <>
      <div className={GRID_HEAD} style={{ gridTemplateColumns: COLS }}>
        <span>Move</span>
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
      </div>

      {shown.map((i, index) => (
        <div
          key={i.productCode}
          className={`${GRID_ROW} ${index % 2 === 1 ? "bg-row_stripe" : ""}`}
          style={{ gridTemplateColumns: COLS }}
          title={
            i.move === "stopped"
              ? `Was ${i.baseline.toFixed(1)} receipts/week before this one`
              : undefined
          }
        >
          <span>
            {i.move !== "steady" && (
              <span
                className={`text-[10.5px] leading-4 px-1.5 py-px rounded-full capitalize ${BADGE[i.move]}`}
              >
                {i.move}
              </span>
            )}
          </span>
          <span
            className={`${GRID_CELL} font-medium ${
              i.move === "stopped" ? "opacity-85" : ""
            }`}
          >
            {i.description}
          </span>
          <span className={GRID_NUM}>{Math.abs(i.qty)}</span>
          <span className={GRID_NUM}>
            {i.move === "stopped" ? "—" : `−${formatCurrency2(i.value)}`}
          </span>
        </div>
      ))}

      {shown.length === 0 && (
        <Note
          text={`No item moved — all ${items.length} are steady against the earlier weeks.`}
        />
      )}

      {(steady > 0 || movers.length > shown.length) && (
        <div className="flex items-center gap-2 px-3 py-1.5 min-h-[38px] border-b border-gray-100">
          <span className="text-[11.5px] text-content/85 flex-1">
            {showAll
              ? `${items.length} items`
              : `${items.length - shown.length} more, ${steady === items.length - shown.length ? "all steady" : "including steady"}`}
          </span>
          <button
            onClick={onToggleAll}
            className="text-[11.5px] font-medium px-2 py-0.5 rounded border border-gray-200 text-content hover:bg-gray-50 transition-colors"
          >
            {showAll ? "Movers only" : `All ${items.length} items`}
          </button>
        </div>
      )}
    </>
  );
};

export default CaseItems;
