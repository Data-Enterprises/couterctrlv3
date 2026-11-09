// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../../../utils";

// Interfaces
import type { ReceiverDetailsItem } from "../../../../../../../interfaces";

interface BodyRowProps {
  item: ReceiverDetailsItem;
}

/** One line item of a receiver: line number, UPC, description, quantities, costs, retail, GM, free and return. */
const BodyRow = ({ item }: BodyRowProps) => {
  return (
    <tr className="even:bg-row_stripe hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {item.line_number}
      </td>
      <td className="px-3 py-2 tabular-nums text-content/85 whitespace-nowrap">
        {item.product_code}
      </td>
      <td className="px-3 py-2 font-medium text-content/85 truncate max-w-0">
        {item.product_description}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {item.cases}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {item.units}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {formatCurrency2(item.ucost)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {formatCurrency2(item.ext_cost)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {formatCurrency2(item.retail)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums font-semibold text-content/85">
        {formatCurrency2(item.ext_retail)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {formatBigNumber(item.gm, 2)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {item.free}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-content/85">
        {item.return}
      </td>
    </tr>
  );
};

export default BodyRow;
