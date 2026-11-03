/**
 * One figure as a small tile: the number, then what it is.
 *
 * Shared by Baskets and Averages so the two cards read as a pair: the same
 * tint, border, sizes and truncation, defined once.
 */
const RecapTile = ({
  value,
  label,
  short,
}: {
  value: string;
  label: string;
  short: boolean;
}) => (
  <div
    className={`min-w-0 rounded-lg border border-brand_line bg-bkg/40 px-2.5 ${short ? "py-1.5" : "py-2"}`}
  >
    <div className={`${short ? "text-[17px]" : "text-[19px]"} font-bold text-content tabular-nums truncate`}>
      {value}
    </div>
    <div className="text-[12px] text-content truncate">{label}</div>
  </div>
);

export default RecapTile;
