// Utils
import { MINUS } from "../utils";

interface HourStatProps {
  label: string;
  /** The open store's figure less the counterpart's. */
  value: number;
  fmt: (v: number) => string;
}

/** One line of the focused hour's gaps: vs TY, vs LW or vs LY, signed and
 *  coloured for which way it went. */
const HourStat = ({ label, value, fmt }: HourStatProps) => (
  <div className="flex items-baseline gap-2 px-3 py-2 bg-custom-white">
    <span className="text-[11.5px] text-content/95 w-[52px] flex-shrink-0">
      {label}
    </span>
    <span
      className={`ml-auto tabular-nums text-[13.5px] font-bold ${
        value >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
      }`}
    >
      {value >= 0 ? "+" : MINUS}
      {fmt(Math.abs(value))}
    </span>
  </div>
);

export default HourStat;
