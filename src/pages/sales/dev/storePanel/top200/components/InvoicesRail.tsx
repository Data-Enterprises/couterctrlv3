// Utils
import { dayText, moneyText } from "../utils";

// Interfaces
import type { ItemDetailResponse } from "../../../../../../api/topItems";
import type { TopItemCompared } from "../utils/topItems";

// Components
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

/** The selected item's invoices, sliding over the panel. */
const InvoicesRail = ({
  invoicesOpen,
  setInvoicesOpen,
  selected,
  detail,
}: {
  invoicesOpen: boolean;
  setInvoicesOpen: (open: boolean) => void;
  selected: TopItemCompared | null;
  detail: ItemDetailResponse | null;
}) => (
  <div
    aria-hidden={!invoicesOpen}
    className={`absolute inset-y-0 right-0 w-full z-30 flex flex-col bg-custom-white border-l-2 border-brand_navy/25 shadow-rail transition-transform duration-200 ease-out motion-reduce:transition-none ${
      invoicesOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    <button
      onClick={() => setInvoicesOpen(false)}
      tabIndex={invoicesOpen ? 0 : -1}
      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-brand_navy/15 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
    >
      <ChevronLeftIcon className="w-4 h-4 flex-shrink-0 text-content/95" />
      <span className="text-[12.5px] font-semibold text-content">
        Invoices
      </span>
      <span className="text-[11.5px] text-content/95 truncate">
        {selected?.ty.product_description}
      </span>
      <span className="flex-1" />
      <span className="text-[11.5px] font-semibold text-content/95">
        {detail?.cost_history.length ?? 0}
      </span>
    </button>

    {/* Its own scroll: sixty days of a weekly-delivered item is
        seventeen rows, which is what drove the cost window down from
        120 days in the first place. */}
    <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3 py-2">
      <div className="grid grid-cols-[78px_1fr_54px_62px_62px] gap-2 pb-1 border-b border-brand_navy/15 text-[11px] font-semibold uppercase tracking-wide text-content/95">
        <span>Invoice</span>
        <span>Vendor</span>
        {/* Cases, because that is the unit the invoice is written in.
            It is NOT units sold: converting one to the other needs a
            case size this endpoint does not return, and a number that
            looks comparable but is not would be worse than none. */}
        <span className="text-right">Cases</span>
        <span className="text-right">List</span>
        <span className="text-right">Paid</span>
      </div>
      {[...(detail?.cost_history ?? [])].reverse().map((h) => (
        <div
          key={h.invoice_date}
          className="grid grid-cols-[78px_1fr_54px_62px_62px] gap-2 items-center py-1 border-b border-brand_navy/15 text-[12px] text-content even:bg-row_stripe"
        >
          <span className="tabular-nums">
            {dayText(h.invoice_date)}
          </span>
          <span className="truncate text-content/95">
            {h.vendor_name ?? "—"}
          </span>
          <span className="text-right tabular-nums text-content/95">
            {h.cases > 0 ? h.cases.toLocaleString() : "—"}
          </span>
          <span className="text-right tabular-nums text-content/95">
            {moneyText(h.list_unit)}
          </span>
          {/* Green is the allowance. The endpoint returns it as its
                  own field, but it IS list minus paid, so a third
                  column would say the same thing twice. */}
          <span
            className={`text-right tabular-nums font-semibold ${
              h.allowance > 0.0001
                ? "text-severity_healthy_text"
                : "text-content"
            }`}
            title={
              h.allowance > 0.0001
                ? `${moneyText(h.allowance)} allowance`
                : undefined
            }
          >
            {moneyText(h.paid_unit)}
          </span>
        </div>
      ))}
      <p className="text-[13px] text-content/95 mt-1.5 leading-snug">
        Green is an allowance — paid under list. Cost reaches back
        further than the sales week on purpose: a week cannot say
        whether today&rsquo;s price is a good one.
      </p>
    </div>
  </div>
);

export default InvoicesRail;
