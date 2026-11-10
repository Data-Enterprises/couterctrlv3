// Interfaces
import type { ReceiverListItem } from "../../../../../../interfaces";

interface InvoiceRowProps {
  r: ReceiverListItem;
}

/** The phone receiver list's invoice label: invoice number, vendor and item count. */
const InvoiceRow = ({ r }: InvoiceRowProps) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[12px] font-medium text-content truncate">
        #{r.invoiceid}
        <span className="ml-2 text-[11px] text-content/95 truncate">
          {r.vendor_name}
        </span>
      </div>
      <div className="text-[10px] text-content/95 mt-0.5">{r.items} items</div>
    </div>
  );
};

export default InvoiceRow;
