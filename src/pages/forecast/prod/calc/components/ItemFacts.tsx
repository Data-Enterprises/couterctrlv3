// Utils
import { formatCurrency2 } from "../../../../../utils";

interface ItemFactsProps {
  regularRetail: number;
  overallUnits: number;
  daysActive: number;
  pricePoints: number;
}

/** The item facts the fit stands on: Reg retail is the baseline every
 *  Markdown figure is measured against; price points is how many prices the
 *  demand curve is fitted through. */
const ItemFacts = ({
  regularRetail,
  overallUnits,
  daysActive,
  pricePoints,
}: ItemFactsProps) => (
  <div className="grid grid-cols-4 divide-x divide-brand_navy/15 border-b border-line_hair bg-fill_soft flex-shrink-0">
    {(
      [
        ["Reg retail", formatCurrency2(regularRetail)],
        ["90-day qty", overallUnits.toLocaleString()],
        ["Days active", `${daysActive} / 90`],
        ["Price points", String(pricePoints)],
      ] as const
    ).map(([label, value]) => (
      <div key={label} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
        <div className="text-[10px] cc-caps-strong">{label}</div>
        <div className="text-[13px] font-bold text-content truncate tabular-nums">
          {value}
        </div>
      </div>
    ))}
  </div>
);

export default ItemFacts;
