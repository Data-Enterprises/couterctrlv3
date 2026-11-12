// Utils
import { count, money } from "../utils";
import { CAUSE_LABEL, CAUSE_TONE } from "../utils/deptInvestigation";
import { ROW_COLS, reasonLabel, reasonOf } from "../utils/holdsRows";

// Interfaces
import type { ItemVerdict, RowKind } from "../interfaces";

interface RowLineProps {
  item: ItemVerdict;
  n: number;
  kind: RowKind;
  fmt: (v: number) => string;
  /** The row's biggest difference, which sets the bars' scale. */
  widest: number;
  onPick: (code: string) => void;
  onMenu: (x: number, y: number, code: string) => void;
}

/** One item in a row's slide: why it is there, the two stores' figures
 *  behind that, and the difference. */
const RowLine = ({ item, n, kind, fmt, widest, onPick, onMenu }: RowLineProps) => {
  const lb = item.weighted ? " lb" : "";
  const per = item.weighted ? "/lb" : "";
  const both = kind === "bothLess" || kind === "bothMore";
  const reason = both ? reasonOf(item) : null;
  const behind = item.gap < 0;
  const minePer = item.mineUnits > 0 ? item.mineSales / item.mineUnits : 0;
  const theirsPer = item.theirsUnits > 0 ? item.theirsSales / item.theirsUnits : 0;

  return (
    <button
      type="button"
      onClick={() => onPick(item.productCode)}
      title="View in Items"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e.clientX, e.clientY, item.productCode);
      }}
      className={`w-full grid ${ROW_COLS[kind]} gap-3 items-center px-1.5 py-1.5 border-b border-brand_navy/15 hover:bg-bkg rounded text-left`}
    >
      <span className="text-[12px] text-content/95 tabular-nums">{n}</span>
      <span className="min-w-0 truncate text-[12.5px] font-mono text-content">
        {item.description}
      </span>

      {kind === "onlyTheirs" && (
        <>
          <span className="min-w-0">
            <span
              className={`cc-tag text-[11px] whitespace-nowrap ${CAUSE_TONE[item.cause].chip}`}
            >
              {CAUSE_LABEL[item.cause]}
            </span>
          </span>
          <span className="text-[12px] text-content/95 tabular-nums whitespace-nowrap">
            {count(item.theirsUnits)}
            {lb}
          </span>
        </>
      )}

      {kind === "onlyMine" && (
        <span className="text-[12px] text-content/95 tabular-nums whitespace-nowrap">
          {count(item.mineUnits)}
          {lb}
        </span>
      )}

      {both && reason && (
        <>
          <span className="min-w-0">
            <span className="cc-tag text-[11px] whitespace-nowrap bg-fill_muted text-content">
              {reasonLabel(reason, kind === "bothMore")}
            </span>
          </span>
          <span
            className={`text-[12px] text-content tabular-nums whitespace-nowrap ${
              reason === "price" ? "" : "font-bold"
            }`}
          >
            {count(item.mineUnits)} vs {count(item.theirsUnits)}
            {lb}
          </span>
          <span
            className={`text-[12px] text-content tabular-nums whitespace-nowrap ${
              reason === "units" ? "" : "font-bold"
            }`}
          >
            {money(minePer)} vs {money(theirsPer)}
            {per}
          </span>
        </>
      )}

      <span className="h-[8.4px] rounded-sm bg-bkg">
        <span
          className={`block h-[8.4px] rounded-sm ${behind ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${(Math.abs(item.gap) / Math.max(1e-9, widest)) * 100}%` }}
        />
      </span>
      <span
        className={`text-right text-[12.5px] font-bold tabular-nums whitespace-nowrap ${
          behind ? "text-delta_negative_text" : "text-delta_positive_text"
        }`}
      >
        {behind ? "−" : "+"}
        {fmt(Math.abs(item.gap))}
      </span>
    </button>
  );
};

export default RowLine;
