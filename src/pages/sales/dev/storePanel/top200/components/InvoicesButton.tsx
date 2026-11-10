// Utils
import { dayText } from "../utils";

// Interfaces
import type { ItemDetailResponse } from "../../../../../../api/topItems";

// Components
import {
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";

/** Opens the invoices rail. */
const InvoicesButton = ({
  detail,
  setInvoicesOpen,
}: {
  detail: ItemDetailResponse;
  setInvoicesOpen: (open: boolean) => void;
}) => (
  <button
    onClick={() => setInvoicesOpen(true)}
    className="flex items-center gap-2 w-full mx-4 mb-3 px-3 py-2 rounded-md border border-brand_navy/15 bg-custom-white hover:bg-gray-50 transition-colors text-left"
    style={{ width: "calc(100% - 2rem)" }}
  >
    <DocumentTextIcon className="w-4 h-4 flex-shrink-0 text-content/95" />
    <span className="text-[12.5px] font-semibold text-content">
      Invoices
    </span>
    <span className="text-[11.5px] text-content/95 truncate">
      {detail.cost_history.length} deliver
      {detail.cost_history.length === 1 ? "y" : "ies"} ·{" "}
      {dayText(
        detail.cost_history[detail.cost_history.length - 1]
          ?.invoice_date,
      )}{" "}
      most recent
    </span>
    <span className="flex-1" />
    <ChevronRightIcon className="w-4 h-4 flex-shrink-0 text-content/95" />
  </button>
);

export default InvoicesButton;
