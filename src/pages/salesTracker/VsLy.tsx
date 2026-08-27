import { formatCurrency2 } from "../../utils";
import { changeTone, signed, signedPct } from "./trackerTone";
import { NUM } from "./trackerColumns";

interface VsLyProps {
  dollarChange: number | null;
  pctChange: number | null;
  /** Row level. `sub` for the department list, `day` one step down. */
  size?: "sub" | "day";
  /**
   * Green/red on the sign. Off for rows inside an open week: seven coloured
   * day rows under a coloured week line turns the card into a block of red and
   * green, and the colour stops meaning anything. The sign still reads, and
   * the week line above keeps the colour that matters.
   */
  colored?: boolean;
  /**
   * Filled pill carrying an `LY` label, matching the panel header's
   * `LY +1.25%`.
   *
   * Two jobs. It names what the figure is measured against, which plain
   * coloured text never did. And it fills its column, so the sales figure
   * beside it has something to sit against — right-aligned bare text left a
   * band of dead space and the sales figure looked stranded.
   */
  variant?: "plain" | "pill";
}

/**
 * The comparison to last year, dollars and percent in one cell.
 *
 * They were two columns, each coloured, which gave every row two competing
 * anchors and put the loudest one — a filled pill — on the percentage. The
 * percentage is the less useful of the two here: a small department can post a
 * four-figure percent on a few dollars, and on a page about where the money
 * went that reads as the biggest number on screen.
 *
 * So: dollars lead at full weight, the percent follows in the same colour at a
 * step down, and one divider makes them read as one fact rather than two.
 */
const PILL_FILL = (v: number | null) => {
  if (v === null) return "bg-gray-100 text-content";
  if (v > 0) return "bg-severity_healthy_bg text-severity_healthy_text";
  if (v < 0) return "bg-severity_critical_bg text-severity_critical_text";
  return "bg-gray-100 text-content";
};

const VsLy = ({
  dollarChange,
  pctChange,
  size = "sub",
  colored = true,
  variant = "plain",
}: VsLyProps) => {
  const big = size === "sub" ? "text-[13.5px]" : "text-[12px]";
  const small = size === "sub" ? "text-[12px]" : "text-[11px]";
  const isPill = variant === "pill";

  const tone = isPill
    ? PILL_FILL(dollarChange)
    : colored
      ? changeTone(dollarChange)
      : "text-content";

  if (dollarChange === null && pctChange === null) {
    return isPill ? (
      <span
        className={`inline-flex items-baseline gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 ml-auto ${NUM}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-content">
          LY
        </span>
        <span className={`${big} font-semibold text-content`}>—</span>
      </span>
    ) : (
      <span className={`${big} text-content text-right ${NUM}`}>—</span>
    );
  }

  return (
    <span
      className={`items-baseline gap-1.5 ${NUM} ${tone} ${
        isPill
          ? // Same shape as the panel header's pill: fully rounded, and padded
            // only enough to clear the text. It hugs its content and sits at
            // the right of its column rather than stretching to fill it.
            "inline-flex px-2 py-0.5 rounded-full ml-auto"
          : "flex justify-end"
      }`}
      title="Change against the same period last year"
    >
      {isPill && (
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
          LY
        </span>
      )}
      <span className={`${big} font-semibold`}>
        {signed(dollarChange, formatCurrency2)}
      </span>
      <span className={isPill ? "opacity-40" : "text-gray-300"} aria-hidden="true">
        |
      </span>
      <span className={`${small} font-semibold`}>{signedPct(pctChange)}</span>
    </span>
  );
};

export default VsLy;
