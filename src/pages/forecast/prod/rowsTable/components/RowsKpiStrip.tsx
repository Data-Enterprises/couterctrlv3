// Utils
import { formatCurrency2 } from "../../../../../utils";

interface RowsKpiStripProps {
  itemCount: number;
  totals: { units: number; total: number; markdown: number };
}

/** The four figures over the grid: items, ad forecast units, forecast total
 *  and markdown. */
const RowsKpiStrip = ({ itemCount, totals }: RowsKpiStripProps) => (
  <div className="grid grid-cols-4 divide-x divide-brand_navy/15 border-b border-line_hair bg-fill_soft flex-shrink-0">
    {[
      ["Items", String(itemCount)],
      ["Ad fcst units", totals.units.toLocaleString()],
      ["Fcst total", formatCurrency2(totals.total)],
      ["Markdown", formatCurrency2(totals.markdown)],
    ].map(([label, value]) => (
      <div key={label} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
        <div className="text-[10px] cc-caps-strong">{label}</div>
        <div className="text-[13px] font-bold text-content truncate">
          {value}
        </div>
      </div>
    ))}
  </div>
);

export default RowsKpiStrip;
