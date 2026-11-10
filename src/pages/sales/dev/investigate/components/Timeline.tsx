// Interfaces
import type { SupplyRecord } from "../utils/investigationSteps";

interface TimelineProps {
  orders: SupplyRecord[];
  deliveries: SupplyRecord[];
  window: { start: string; end: string };
  us: string;
  them: string;
}

/**
 * Every order and every delivery, on the window they were read over.
 *
 * Two counts side by side cannot show that one store placed a single order
 * of nine thousand units while the other placed three totalling a few
 * hundred — nor that a lane is empty, which is the strongest way to say
 * nothing arrived. Dot area follows units, so the big order looks big.
 */
const Timeline = ({ orders, deliveries, window, us, them }: TimelineProps) => {
  const day = (d: string) => Date.parse(d.slice(0, 10) + "T12:00:00");
  const from = day(window.start);
  const span = Math.max(1, day(window.end) - from);
  const at = (d: string) =>
    Math.min(100, Math.max(0, ((day(d) - from) / span) * 100));
  /* Area, not width: a 9,000-unit order beside a 2-unit one would be
     invisible on a linear scale and absurd on a square one. */
  const size = (units: number) =>
    Math.max(9, Math.min(28, 8 + Math.sqrt(Math.abs(units)) * 0.25));

  const lanes = [
    { label: us, tone: "bg-store_open", rows: orders.filter((o) => o.mine) },
    {
      label: them,
      tone: "bg-store_compare",
      rows: orders.filter((o) => !o.mine),
    },
    { label: "Received", tone: "", rows: deliveries },
  ];

  const ticks = [0, 25, 50, 75, 100];
  const tickDay = (p: number) =>
    new Date(from + (span * p) / 100).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex flex-col gap-1">
      {lanes.map((lane) => (
        <div key={lane.label} className="flex items-center gap-3">
          <span className="w-[108px] flex-shrink-0 truncate text-[11.5px] font-semibold text-content/95">
            {lane.label}
          </span>
          <span className="relative flex-1 min-w-0 h-11 border-b border-dashed border-brand_navy/20">
            {lane.rows.length === 0 ? (
              <span className="absolute inset-0 flex items-center text-[12px] italic text-content/95">
                Nothing
              </span>
            ) : (
              lane.rows.map((r) => (
                <span
                  key={`${r.mine ? "m" : "t"}-${r.id}`}
                  title={`${r.vendor} · ${Math.round(r.units).toLocaleString("en-US")} units`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${at(r.date)}%` }}
                >
                  <span
                    className={`block rounded-full ${
                      lane.tone ||
                      (r.mine ? "bg-store_open" : "bg-store_compare")
                    }`}
                    style={{ width: size(r.units), height: size(r.units) }}
                  />
                </span>
              ))
            )}
          </span>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="w-[108px] flex-shrink-0" />
        <span className="relative flex-1 min-w-0 h-4">
          {ticks.map((p) => (
            <span
              key={p}
              className="absolute -translate-x-1/2 text-[11px] text-content/95 whitespace-nowrap"
              style={{ left: `${p}%` }}
            >
              {tickDay(p)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default Timeline;
