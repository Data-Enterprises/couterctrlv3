// Hooks
import { useReceiversState } from "../../../../hooks";

// Utils
import { formatCurrency2 } from "../../../../../../../utils";

/** The sticky Totals row at the bottom of the receiver line-item table. */
const Footer = () => {
  const totals = useReceiversState().totals[0] ?? null;

  return (
    <tfoot>
      <tr className="sticky bottom-0 bg-fill_soft border-t-2 border-content/70 font-bold text-[14px]">
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2 text-right text-content/95">Totals</td>
        <td className="cc-num text-content/95">
          {totals.cases}
        </td>
        <td className="cc-num text-content/95">
          {totals.units}
        </td>
        <td className="cc-num text-content/95">
          {formatCurrency2(totals.ucost)}
        </td>
        <td className="cc-num text-content/95">
          {formatCurrency2(totals.ext_cost)}
        </td>
        <td className="cc-num text-content/95">
          {formatCurrency2(totals.retail)}
        </td>
        <td className="cc-num text-content/95">
          {formatCurrency2(totals.ext_retail)}
        </td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2"></td>
      </tr>
    </tfoot>
  );
};

export default Footer;
