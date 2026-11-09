// Hooks
import { useAppSelector } from "../../../../../../../hooks";

// Utils
import { formatCurrency2 } from "../../../../../../../utils";

/** The sticky Totals row at the bottom of the receiver line-item table. */
const Footer = () => {
  const totals = useAppSelector((s) => s.dev.receivers.totals[0] ?? null);

  return (
    <tfoot>
      <tr className="sticky bottom-0 bg-gray-50 border-t-2 border-content/70 font-bold text-[14px]">
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2"></td>
        <td className="px-3 py-2 text-right text-content/85">Totals</td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
          {totals.cases}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
          {totals.units}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
          {formatCurrency2(totals.ucost)}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
          {formatCurrency2(totals.ext_cost)}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
          {formatCurrency2(totals.retail)}
        </td>
        <td className="px-3 py-2 text-right tabular-nums text-content/85">
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
