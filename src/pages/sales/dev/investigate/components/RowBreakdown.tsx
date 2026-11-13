// Utils
import { CAUSE_TIP } from "../utils/deptInvestigation";
import { partTip } from "../utils/holdsRows";

// Interfaces
import type { BreakdownLine } from "../interfaces";

interface RowBreakdownProps {
  lines: BreakdownLine[];
  /** The two stores' numbers, for the cause tooltips. */
  us: string;
  them: string;
  fmt: (v: number) => string;
  cash: (v: number) => string;
}

/** What a row is made of: its causes, or units against price. Red put this
 *  store behind and green put it ahead, as on every bar in the tab, all on
 *  one scale so a part pulling the other way still reads. */
const RowBreakdown = ({ lines, us, them, fmt, cash }: RowBreakdownProps) => {
  const scale = Math.max(1, ...lines.map((l) => Math.abs(l.amount)));
  const total = lines.reduce((t, l) => t + l.amount, 0);
  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-bkg px-3 py-2.5">
      {lines.map((l) => (
        <div
          key={l.label}
          className="grid grid-cols-[150px_minmax(0,1fr)_64px_96px] gap-2.5 items-center"
          title={l.cause ? CAUSE_TIP[l.cause](us, them) : partTip(l, total, cash)}
        >
          <span className="text-[12.5px] font-semibold text-content truncate">
            {l.label}
          </span>
          <span className="h-[8.4px] rounded-sm bg-custom-white">
            <span
              className={`block h-[8.4px] rounded-sm ${
                l.amount < 0 ? "bg-red-500" : "bg-emerald-500"
              }`}
              style={{ width: `${(Math.abs(l.amount) / scale) * 100}%` }}
            />
          </span>
          <span className="text-right text-[12.5px] text-content/95 tabular-nums font-semibold whitespace-nowrap">
            {l.side}
          </span>
          <span
            className={`text-right text-[12.5px] font-bold tabular-nums whitespace-nowrap ${
              l.amount < 0 ? "text-delta_negative_text" : "text-delta_positive_text"
            }`}
          >
            {l.amount < 0 ? "−" : "+"}
            {(l.money ? cash : fmt)(Math.abs(l.amount))}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RowBreakdown;
