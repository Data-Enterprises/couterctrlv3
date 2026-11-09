/**
 * The model as one line, then its terms.
 *
 * Everything else in this document is prose about the formula; without the
 * formula itself a reader has to assemble it from twelve answers. It is the
 * endpoint's own expression, not a paraphrase:
 *
 *     suggested_weight = demand(cover window, by weekday) x shrink - on_hand
 */
const Formula = () => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
    <div className="px-3.5 py-3 border-b border-gray-200 bg-custom-white">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[15px] tabular-nums">
        <span className="font-bold text-brand_navy">Suggested weight</span>
        <span className="text-content/85">=</span>
        <span className="font-semibold text-content">demand</span>
        <span className="text-content/85">&times;</span>
        <span className="font-semibold text-content">waste</span>
        <span className="text-content/85">&minus;</span>
        <span className="font-semibold text-content">stock on hand</span>
      </div>
    </div>
    <dl className="m-0 divide-y divide-gray-200">
      {[
        {
          t: "demand",
          d: "This item's rate for each weekday the delivery covers, added up. A four-day order over a weekend adds four weekend rates, not four average days.",
        },
        {
          t: "weekday rate",
          d: "Pounds this item sold on that weekday across the lookback, divided by how many times that weekday came round in it — twelve Fridays, not the number of Fridays it happened to sell on.",
        },
        {
          t: "waste",
          d: "1 plus that item's own recorded waste rate. 1.00 where there is no record, and capped where the raw rate exceeds what waste can plausibly be.",
        },
        {
          t: "stock on hand",
          d: "What was ordered and has not sold yet, subtracted so you are not buying it twice. Measured over the days this order has to cover, not the whole lookback — stock is a level, and a figure that grows the further back you look is not one.",
        },
      ].map((r) => (
        <div key={r.t} className="grid grid-cols-[8.5rem_1fr] gap-4 px-3.5 py-2.5">
          <dt className="m-0 text-[14px] font-bold text-brand_navy">{r.t}</dt>
          <dd className="m-0 text-[14px] leading-[1.6] text-content">{r.d}</dd>
        </div>
      ))}
    </dl>
    <div className="px-3.5 py-2.5 border-t border-gray-200 text-[13px] leading-snug text-content/85">
      The result is floored at zero — the model never asks for a negative order.
    </div>
  </div>
);

export default Formula;
