/**
 * The three-column TY / vs-last-week / vs-last-year strip that opens every
 * Performance report on mobile.
 *
 * Each cell names the window it is reporting on its own line — "vs last week"
 * alone leaves the reader to work out which seven days that was, and it moves
 * with the day strip underneath.
 *
 * Extracted when Sub Dept Margins, Categories and Vendors all needed the same
 * strip. Sales still renders its own copy inline; folding that in is the next
 * step, and is deliberately not bundled into this change.
 */

export interface KpiCell {
  /** e.g. "TY net sales", "vs last week". */
  label: string;
  /** The window this cell covers, e.g. "Aug 4 – Aug 10" or "Mon, Aug 4". */
  dateLabel: string;
  /** Already formatted — the caller owns currency vs percent vs units. */
  value: string;
  /**
   * Change against the TY cell, already formatted (percent or margin points).
   * Null on the TY cell itself, and on any comparison with no basis.
   */
  delta?: { text: string; up: boolean } | null;
}

const MobileKpiStrip = ({ cells }: { cells: KpiCell[] }) => (
  <div
    className="grid divide-x divide-gray-100 bg-custom-white border-b border-gray-100 flex-shrink-0"
    style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
  >
    {cells.map((c) => (
      <div key={c.label} className="px-3 py-2">
        <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
          {c.label}
        </div>
        <div className="text-[10px] text-content/85 mt-0.5">{c.dateLabel}</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[12px] font-semibold text-content">
            {c.value}
          </span>
          {c.delta && (
            <span
              className={`text-[10px] font-semibold ${c.delta.up ? "text-emerald-600" : "text-red-500"}`}
            >
              {c.delta.text}
            </span>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default MobileKpiStrip;
