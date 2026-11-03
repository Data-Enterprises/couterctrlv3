import type { RecapDayHours } from "./recapTypes";

/**
 * A day's hours as a tiny bar strip, beside its busiest hour.
 *
 * Enough to see the day's shape without opening it. The busiest hour is in
 * full navy and the rest at a quarter: that marks a fact, it is not a grade.
 * Decorative, since the label beside it says the same thing in words.
 */
const RecapHourSpark = ({ shape }: { shape: RecapDayHours }) => {
  const top = shape.peak?.net ?? 0;
  return (
    <span aria-hidden="true" className="flex items-end gap-px h-5 w-[72px] flex-shrink-0">
      {shape.hours.map((h) => (
        <span
          key={h.hour}
          className={`flex-1 rounded-[1px] ${
            h.hour === shape.peak?.hour ? "bg-brand_navy" : "bg-brand_navy/25"
          }`}
          style={{ height: `${top > 0 ? Math.max(8, (Math.max(0, h.net) / top) * 100) : 8}%` }}
        />
      ))}
    </span>
  );
};

export default RecapHourSpark;
