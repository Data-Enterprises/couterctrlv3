// Utils
import { formatDate } from "../../../../../../utils";

// Interfaces
import type { ReceiverListItem } from "../../../../../../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import ItemInnerRow from "./ItemInnerRow";

interface RListItemRowsProps {
  group: {
    date: string;
    items: ReceiverListItem[];
  };
  toggleDate: (key: string) => void;
  dateOpen: boolean;
  selectedInvoice: string;
  getSelectedDetails: (invoiceid: number, transDate: string) => void;
}

/** One date group in the receiver list: a collapsible date row with its receiver count,
 *  opening to that day's invoice rows under a column heading. */
const RListItemRows = ({
  group,
  toggleDate,
  dateOpen,
  selectedInvoice,
  getSelectedDetails,
}: RListItemRowsProps) => {
  return (
    <div>
      {/* Date row */}
      <button
        onClick={() => toggleDate(group.date)}
        className="w-full grid grid-cols-[1fr_56px_10%_32px] items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[12px] font-medium text-content text-left truncate">
          {formatDate(group.date)}
        </span>
        <span className="text-[12px] text-content flex-shrink-0 text-center font-medium">
          {group.items.length}
        </span>
        <div></div>
        <ChevronRightIcon
          className="w-3 h-3 text-content/40 flex-shrink-0 justify-self-end transition-transform"
          style={{
            transform: dateOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Invoice rows */}
      {dateOpen && (
        <div>
          <div className="grid grid-cols-[60px_70px_1fr] gap-2 pl-6 pr-3 py-1.5 bg-gray-50 text-[9.5px] font-bold uppercase tracking-wide text-content/85">
            <div>Invoice #</div>
            <div>Item count</div>
            <div>Vendor</div>
          </div>
          <div className="divide-y divide-brand_navy/15">
            {group.items.map((item) => {
              const isSel = selectedInvoice === item.invoiceid.toString();
              const getDetails = () =>
                getSelectedDetails(
                  item.invoiceid,
                  formatDate(item.invoice_date),
                );
              return (
                <ItemInnerRow
                  key={item.invoiceid}
                  item={item}
                  getDetails={getDetails}
                  isSel={isSel}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RListItemRows;
