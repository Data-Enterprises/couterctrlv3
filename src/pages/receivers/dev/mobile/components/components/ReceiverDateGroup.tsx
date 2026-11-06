// Utils
import { fmtDate } from "../utils";

// Interfaces
import type { ReceiverListItem } from "@/interfaces";

// Components
import InvoiceRow from "./InvoiceRow";

interface Props {
  group: {
    date: string;
    items: ReceiverListItem[];
  };
  isOpen: boolean;
  toggleDate: (key: string) => void;
  handleReceiverTap: (receiver: ReceiverListItem) => void;
}

const ReceiverDateGroup = ({
  isOpen,
  group,
  toggleDate,
  handleReceiverTap,
}: Props) => {
  return (
    <div>
      <button
        onClick={() => toggleDate(group.date)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-custom-white text-left active:bg-gray-50 gap-3"
      >
        <span className="text-[12px] font-medium text-content">
          {fmtDate(group.date)}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-content/95 tabular-nums">
            {group.items.length}{" "}
            {group.items.length === 1 ? "invoice" : "invoices"}
          </span>
          <svg
            className="w-4 h-4 text-content/95 transition-transform"
            style={{
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="bg-gray-50 divide-y divide-brand_navy/15">
          {group.items.map((r) => (
            <button
              key={`${r.invoiceid}-${r.invoice_date}`}
              onClick={() => handleReceiverTap(r)}
              className="w-full flex items-center pl-6 pr-3 py-2.5 text-left active:bg-gray-100 gap-3"
            >
              <InvoiceRow r={r} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverDateGroup;
