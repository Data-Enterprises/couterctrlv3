// Hooks
import { useReceiversState } from "../../../hooks";
// Utils
import { formatCurrency2 } from "../../../../../../utils";

/** The receiver detail's totals strip: cases, units, unit cost, extended cost, retail and extended retail.
 *  Draws nothing until the totals have loaded. */
const DetailKpiStrip = () => {
  const totals = useReceiversState().totals[0] ?? null;

  if (!totals) return null;

  return (
    <div className="grid grid-cols-6 divide-x divide-brand_navy/15 border-b border-brand_navy/15 bg-fill_soft flex-shrink-0">
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          Cases
        </div>
        <div className="text-[14px] font-bold text-content">{totals.cases}</div>
      </div>
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          Units
        </div>
        <div className="text-[14px] font-bold text-content">{totals.units}</div>
      </div>
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          U Cost
        </div>
        <div className="text-[14px] font-bold text-content">
          {formatCurrency2(totals.ucost)}
        </div>
      </div>
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          Ext Cost
        </div>
        <div className="text-[14px] font-bold text-content">
          {formatCurrency2(totals.ext_cost)}
        </div>
      </div>
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          Retail
        </div>
        <div className="text-[14px] font-bold text-content">
          {formatCurrency2(totals.retail)}
        </div>
      </div>
      <div className="px-4 py-2 text-center">
        <div className="text-[10px] cc-caps-strong">
          Ext Retail
        </div>
        <div className="text-[14px] font-bold text-content">
          {formatCurrency2(totals.ext_retail)}
        </div>
      </div>
    </div>
  );
};

export default DetailKpiStrip;
