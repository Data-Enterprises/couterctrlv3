// Utils
import { DAY_ROWS, NAVY } from "../../../utils";

/** The help's worked weekday chart. */
const DayBars = () => (
  <div className="flex flex-col gap-1">
    {DAY_ROWS.map((d) => (
      <div
        key={d.n}
        className="grid grid-cols-[6.5rem_1fr_5.5rem] gap-3 items-center text-[14px]"
      >
        <span className="text-content">{d.n}</span>
        <span className="bg-gray-200 rounded-sm h-4 overflow-hidden">
          <span
            className="block h-full rounded-sm"
            style={{
              width: `${d.pct}%`,
              background: d.tone === "low" ? "#8a9bb0" : NAVY,
            }}
          />
        </span>
        <span className="text-right tabular-nums font-medium text-content">{d.lb}</span>
      </div>
    ))}
  </div>
);

export default DayBars;
