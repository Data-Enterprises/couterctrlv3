// Utils
import { TEMPLATE } from "../utils";

// Interfaces
import type { Cell } from "../interfaces";

/** One row of a rail section, its figures on the section's grid. */
const Line = ({
  cells,
  zebra,
  onClick,
  template,
}: {
  cells: Cell[];
  /** Overrides the width-by-count default. Two three-column sections want
   *  different shapes, and widening the shared template for one would silently
   *  reflow the other. */
  template?: string;
  /** Explicit rather than `even:` — the delivery rows interleave expansion
   *  strips, and a CSS nth-child rule would restripe everything below an open
   *  one. */
  zebra?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`grid gap-2.5 pl-1 py-1.5 text-[12px] items-center ${
      zebra === undefined ? "even:bg-row_stripe" : zebra ? "bg-row_stripe" : ""
    } ${onClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
    style={{ gridTemplateColumns: template ?? TEMPLATE[cells.length] }}
  >
    {cells.map((c, i) => (
      <span
        key={i}
        className={`tabular-nums ${
          i === 0
            ? "text-content truncate"
            : `text-right font-medium ${c.tone ?? "text-content"}`
        }`}
      >
        {c.text}
      </span>
    ))}
  </div>
);

export default Line;
