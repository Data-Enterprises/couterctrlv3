// Utils
import { formatCurrency2 } from "../../../../../../utils";

// Interfaces
import type { costSwing, validate } from "../../../utils/orderEdit";

interface EditStatusBarProps {
  /** Lines the search shows, and lines on the order. */
  shown: number;
  total: number;
  changedCount: number;
  swing: ReturnType<typeof costSwing> | null;
  checks: ReturnType<typeof validate>;
}

/** The bar under the order's lines: how many are showing, the change in ext
 *  cost, and the checks the file must pass. */
const EditStatusBar = ({
  shown,
  total,
  changedCount,
  swing,
  checks,
}: EditStatusBarProps) => (
  <div className="flex items-center gap-3 flex-wrap border-t border-line_hair px-3 py-1.5 flex-shrink-0">
    <span className="text-[11px] text-content">
      Showing <span className="font-semibold tabular-nums">{shown}</span> of{" "}
      <span className="font-semibold tabular-nums">{total}</span> lines ·{" "}
      {changedCount === 0
        ? "nothing changed yet"
        : `the save sends all ${total}`}
    </span>

    {swing && Math.abs(swing.gap) > 0.004 && (
      <span className="text-[11px] text-content tabular-nums">
        Ext cost{" "}
        <span className="font-semibold">{formatCurrency2(swing.before)}</span> →{" "}
        <span className="font-semibold">{formatCurrency2(swing.after)}</span>{" "}
        <span
          className={`font-bold ${
            swing.gap > 0
              ? "text-delta_negative_text"
              : "text-delta_positive_text"
          }`}
        >
          {swing.gap > 0 ? "+" : "−"}
          {formatCurrency2(Math.abs(swing.gap))}
        </span>
      </span>
    )}

    <span className="ml-auto flex items-center gap-1.5 flex-wrap">
      {checks.map((c) => (
        <span
          key={c.id}
          className={`cc-tag text-[10px] ${
            c.ok
              ? "bg-severity_healthy_bg text-severity_healthy_text"
              : "bg-delta_negative_bg text-delta_negative_text"
          }`}
        >
          {c.ok ? "✓" : "✕"} {c.label}
        </span>
      ))}
    </span>
  </div>
);

export default EditStatusBar;
