// Utils
import { money, NONE } from "../utils";

// Interfaces
import type { ItemVerdict } from "../interfaces";

// Components
import StoreHead from "./StoreHead";

interface SideBySideProps {
  item: ItemVerdict;
  mine: string;
  mineNumber: string;
  theirs: string;
  theirsNumber: string;
}

/**
 * The item, both stores, one table.
 *
 * It used to be three pairs of tinted boxes stacked down the panel: six
 * figures in six frames, with the reader doing the subtraction. One row a
 * measure puts the pair side by side and prints the difference, which is
 * the number the panel exists to explain.
 *
 * Sold for, cost to buy, kept.
 *
 * Three pairs rather than one margin figure, because the question is which of
 * the three is doing the damage. A single "margin: down $42" sends somebody
 * to look at the shelf price, when the shelf price was fine and the invoice
 * was not.
 */
const SideBySide = ({ item, mine, mineNumber, theirs, theirsNumber }: SideBySideProps) => {
  const m = item.margins;
  const noCost = item.mineCogs === 0 && item.theirsCogs === 0;

  const rows: {
    label: string;
    us: string;
    them: string;
    gap: number | null;
  }[] = [
    {
      label: "Sold for",
      us: money(item.mineSales),
      them: money(item.theirsSales),
      gap: item.mineSales - item.theirsSales,
    },
    {
      label: "Cost per unit",
      us: m.minePerUnit === null ? NONE : money(m.minePerUnit),
      them: m.theirsPerUnit === null ? NONE : money(m.theirsPerUnit),
      // Dearer is worse, so the sign is flipped: paying MORE is the gap.
      gap:
        m.minePerUnit === null || m.theirsPerUnit === null
          ? null
          : m.theirsPerUnit - m.minePerUnit,
    },
    {
      label: "Made",
      us: noCost ? NONE : money(m.mine),
      them: noCost ? NONE : money(m.theirs),
      gap: noCost ? null : m.diff,
    },
  ];

  return (
    <div className="rounded-lg bg-custom-white shadow-card-sm overflow-hidden">
      <div
        className="grid gap-x-3 px-3 pt-2.5 pb-1.5 border-b border-brand_navy/15 text-[11.5px] font-bold uppercase tracking-wide text-content/95"
        style={{ gridTemplateColumns: "minmax(0,1fr) 96px 96px 96px" }}
      >
        <span />
        <StoreHead name={mine} number={mineNumber} dot="bg-store_open" />
        <StoreHead name={theirs} number={theirsNumber} dot="bg-store_compare" />
        <span className="text-right self-end">Gap</span>
      </div>

      {rows.map((r) => (
        <div
          key={r.label}
          className="grid gap-x-3 px-3 py-2 border-b border-brand_navy/15 last:border-b-0 text-[13.5px]"
          style={{ gridTemplateColumns: "minmax(0,1fr) 96px 96px 96px" }}
        >
          <span className="text-content/95 truncate">{r.label}</span>
          <span className="text-right tabular-nums font-semibold text-content bg-store_open_tint/50 -my-2 py-2 px-1">
            {r.us}
          </span>
          <span className="text-right tabular-nums font-semibold text-content">
            {r.them}
          </span>
          <span
            className={`text-right tabular-nums font-bold ${
              r.gap === null
                ? "text-content/95"
                : r.gap < 0
                  ? "text-delta_negative_text"
                  : r.gap > 0
                    ? "text-delta_positive_text"
                    : "text-content"
            }`}
          >
            {r.gap === null
              ? NONE
              : (r.gap < 0 ? "−" : r.gap > 0 ? "+" : "") +
                money(Math.abs(r.gap))}
          </span>
        </div>
      ))}

      {noCost && (
        <p className="px-3 py-2 text-[12px] text-content/95 leading-snug border-t border-brand_navy/15">
          No cost came through on either store&rsquo;s lines this week, so what
          this item makes cannot be said.
        </p>
      )}
    </div>
  );
};

export default SideBySide;
