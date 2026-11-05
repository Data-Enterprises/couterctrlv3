// Utils
import { severityDotClass } from "../../../../../../utils/severity";
import {
  metricSigned,
  type ComparedTopItem,
  type CompareMetric,
} from "../utils/topItemsCompare";
import { money, pct, pts, signedMoney, toneOf } from "../utils";

const TONE_PILL: Record<"healthy" | "critical", string> = {
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  critical: "bg-severity_critical_bg text-severity_critical_text",
};

/**
 * One item.
 *
 * The bar is the department comparison's: the track is this pair against the
 * biggest pair, the fill splits by each store's share OF THE PAIR. The open
 * store's segment is green or red by direction and the counterpart is navy,
 * softened — at full strength it is the heaviest colour in the app and it
 * out-shouts the store the reader actually opened.
 *
 * On a one-sided row the fill is the whole measured bar, because that store
 * has all of it. The unknown is a hatched cap OUTSIDE the bar: drawing it
 * inside would shorten a measured thing to make room for an unmeasured one.
 */
const Row = ({
  row,
  widest,
  metric,
  selected,
  onPick,
  onContext,
}: {
  row: ComparedTopItem;
  widest: number;
  metric: CompareMetric;
  selected: boolean;
  onPick: () => void;
  /** Right-click, so the menu can offer this one code as well as the list. */
  onContext: (x: number, y: number) => void;
}) => {
  const signed = metricSigned(row, metric);
  // Ahead or behind, in the ledger's own two colours. No threshold: a
  // third band would have to be "close", and nothing on this screen asks
  // how close two stores are -- only which way.
  const sev = toneOf(signed);
  const minePct = row.pair > 0 ? (row.mineSales / row.pair) * 100 : 0;
  const theirsPct = row.pair > 0 ? (row.theirsSales / row.pair) * 100 : 0;

  return (
    <button
      onClick={onPick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContext(e.clientX, e.clientY);
      }}
      // A heavier rule and more room: at border-gray-100 and py-2 the rows
      // ran together into one grey block and the bars read as a texture
      // rather than as figures.
      className={`w-full text-left px-3.5 py-2.5 border-b transition-colors ${
        selected
          ? // Always the pair: the tint alone reads as a stripe rather than
            // a selection, which is why the audit asks for both.
            "bg-row_selected border-row_selected_border"
          : row.only
            ? "border-brand_line_2 bg-brand_paper hover:bg-bkg"
            : "border-brand_line_2 hover:bg-bkg"
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-content truncate">
          {row.description}
        </span>
        <span className="flex-none text-[11px] text-content">{row.dept}</span>
        <span
          className={`flex-none tabular-nums text-[11.5px] font-bold px-1.5 py-px rounded ${TONE_PILL[sev]}`}
          title={
            row.only !== null
              ? `At least ${pts(signed)} points apart — this item is outside the other store's top 200, so their share is unknown`
              : `This store takes ${pct(
                  row.mineShare,
                )} of its top 200 on this item against ${pct(
                  row.theirsShare,
                )} at the other — ${pts(signed)} points apart. Not the sales difference: share, so the two stores compare whatever their size.`
          }
        >
          {row.only !== null ? "≥ " : ""}
          {metric === "sales" ? signedMoney(signed) : `${pts(signed)} pts`}
        </span>
      </span>

      <span className="block mt-1.5 h-[9px] rounded-sm bg-bkg overflow-hidden flex">
        <span className="h-full flex" style={{ width: `${(row.pair / Math.max(1, widest)) * 100}%` }}>
          {/* delta_positive_TEXT, not _mid. `delta_positive_mid` is a CSS
              variable that was never added to the Tailwind config, so the
              class produced nothing and every "ahead" segment rendered
              invisible — only the counterpart's navy showed. */}
          <span
            className={severityDotClass[sev]}
            style={{ width: `${minePct}%` }}
          />
          <span className="bg-brand_navy/15" style={{ width: `${theirsPct}%` }} />
        </span>
        {row.only !== null && (
          <span
            className="w-3.5 flex-none border-l border-brand_line_2"
            style={{
              background:
                "repeating-linear-gradient(135deg, rgb(var(--color-brand-line-2)) 0 4px, rgb(var(--color-bkg)) 4px 8px)",
            }}
            title="Not in the other store's top 200"
          />
        )}
      </span>

      {/* A swatch against each figure, tying it to its own half of the bar.
          The two used to sit either side of a "|", which left the reader
          working out which number belonged to which store. */}
      <span className="flex items-center gap-3.5 mt-2">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-none ${severityDotClass[sev]}`}
          />
          <span className="tabular-nums text-[12px] font-semibold text-content whitespace-nowrap">
            {row.mine
              ? `${money(row.mineSales)} · ${pct(row.mineShare)}`
              : "not in top 200"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full flex-none bg-brand_navy/15 border border-brand_navy/25" />
          <span className="tabular-nums text-[12px] font-semibold text-content whitespace-nowrap">
            {row.theirs
              ? `${money(row.theirsSales)} · ${pct(row.theirsShare)}`
              : "not in top 200"}
          </span>
        </span>
      </span>
    </button>
  );
};

export default Row;
