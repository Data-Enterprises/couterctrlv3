// Utils
import { count, money, perBasket, weightLabel } from "../utils";

// Interfaces
import type { PricePoint } from "../interfaces";

interface RungProps {
  p: PricePoint;
  weighed: boolean;
}

/** One price, and what went out at it. */
const Rung = ({ p, weighed }: RungProps) => (
  <div className="flex items-baseline gap-2.5 py-1.5 border-b border-brand_navy/15 last:border-b-0">
    {/* Per pound on a scale item, which is what the shelf says. It used to
        be sales divided by scans -- the price of an average package, which
        nobody ever paid and which moved with the size of the packages. */}
    <span className="w-[78px] flex-shrink-0 text-[15px] font-bold tabular-nums text-content">
      {money(p.price)}
      {weighed && (
        <span className="text-[11px] font-semibold text-content/95">/lb</span>
      )}
    </span>
    <span className="min-w-0 flex-1 text-[12px] text-content/95 tabular-nums truncate">
      {weighed ? weightLabel(p) : `${count(p.units)} qty`} · {p.days}d ·{" "}
      {count(p.transactions)} baskets
    </span>
    {/*
      What one customer carried out, which only the transaction count can give.

      On a scale item that has to be POUNDS over baskets, not rings over
      baskets — the latter is 1.00 on every row of every weighted item, since
      one package is one scan, and a column that always reads 1.00 is a column
      saying nothing.
    */}
    <span
      title={
        weighed
          ? "Average pounds of this item in a basket that carried it, at this price"
          : "Average units of this item in a basket that carried it, at this price"
      }
      className={`flex-shrink-0 text-right text-[12px] tabular-nums ${
        (perBasket(p, weighed) ?? 0) >= 1.5
          ? "font-bold text-delta_positive_text"
          : "text-content/95"
      }`}
    >
      {perBasket(p, weighed) === null
        ? "—"
        : `avg ${(perBasket(p, weighed) as number).toFixed(2)} ${
            weighed ? "lb" : "qty"
          } per basket`}
    </span>
  </div>
);

export default Rung;
