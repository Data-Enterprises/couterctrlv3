import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import type {
  ExtractedInvoice,
  InvoiceReconciliation,
  InvoiceReconciliationCheck,
} from "../../../interfaces";
import { isNegative, printed } from "..";

interface InvoiceDetailPanelProps {
  invoice: ExtractedInvoice;
  reconciliation?: InvoiceReconciliation;
}

const Field = ({ label, value }: { label: string; value?: string }) => (
  <div className="min-w-0">
    <div className="text-[10.5px] uppercase tracking-wide text-content/40">
      {label}
    </div>
    <div className="text-[13px] text-content truncate">{printed(value)}</div>
  </div>
);

const Total = ({ label, value }: { label: string; value?: string }) => (
  <div className="px-2.5 py-1.5 rounded-lg bg-bkg min-w-0">
    <div className="text-[10.5px] uppercase tracking-wide text-content/40">
      {label}
    </div>
    <div
      className={`text-[13px] font-semibold tabular-nums truncate ${
        isNegative(value) ? "text-severity_critical_text" : "text-content"
      }`}
    >
      {printed(value)}
    </div>
  </div>
);

/** Derived vs reported, both exactly as the server computed and read them. The
 *  difference isn't shown as a number on purpose — these are printed strings
 *  with whatever decimal places the invoice used, and subtracting them in the
 *  browser is exactly the float arithmetic the backend avoided. */
const Check = ({ check }: { check: InvoiceReconciliationCheck }) => (
  <div
    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
      check.ok ? "bg-severity_healthy_bg" : "bg-severity_critical_bg"
    }`}
  >
    {check.ok ? (
      <CheckCircleIcon className="w-4 h-4 text-severity_healthy_text flex-shrink-0" />
    ) : (
      <ExclamationTriangleIcon className="w-4 h-4 text-severity_critical_text flex-shrink-0" />
    )}
    <span
      className={`text-[12px] font-medium flex-1 min-w-0 truncate ${
        check.ok ? "text-severity_healthy_text" : "text-severity_critical_text"
      }`}
    >
      {check.label}
    </span>
    <span className="text-[12px] tabular-nums text-content/70 flex-shrink-0">
      {check.derived}
      <span className="text-content/40"> vs </span>
      {check.reported}
    </span>
  </div>
);

const COLS = "grid grid-cols-[2.5rem_7rem_1fr_4rem_5.5rem_5.5rem_6rem] gap-2";

const InvoiceDetailPanel = ({
  invoice,
  reconciliation,
}: InvoiceDetailPanelProps) => {
  const lines = invoice.lines ?? [];

  return (
    <div className="h-full bg-custom-white rounded-xl shadow-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-content truncate">
            Invoice {invoice.invoiceNumber}
          </h2>
          {reconciliation && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                reconciliation.reconciled
                  ? "bg-severity_healthy_bg text-severity_healthy_text"
                  : "bg-severity_critical_bg text-severity_critical_text"
              }`}
            >
              {reconciliation.reconciled ? "Reconciled" : "Does not reconcile"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-3 mt-2.5">
          <Field label="Date" value={invoice.invoiceDate} />
          <Field label="Vendor" value={invoice.vendor} />
          <Field label="Store" value={invoice.storeNumber} />
          <Field label="Pages" value={invoice.pages} />
          <Field label="Source File" value={reconciliation?.file} />
        </div>
      </div>

      <div className="px-4 py-2.5 border-b border-gray-100 flex flex-col gap-2 flex-shrink-0">
        <div className="grid grid-cols-5 gap-2">
          <Total label="Subtotal" value={invoice.totals?.subtotal} />
          <Total label="Service Fee" value={invoice.totals?.serviceFee} />
          <Total label="Deposit" value={invoice.totals?.deposit} />
          <Total label="Credits" value={invoice.totals?.credits} />
          <Total label="Invoice Total" value={invoice.totals?.invoiceTotal} />
        </div>

        {reconciliation && (
          <div className="flex flex-col gap-1.5">
            {reconciliation.checks.map((check) => (
              <Check key={check.label} check={check} />
            ))}
            {!reconciliation.reconciled && (
              <div className="text-[11px] text-content/50 leading-snug">
                A mismatch usually means a line was missed or misread on the
                scan — check the failing figure against the source document
                before posting this invoice.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-4 py-2">
        <div
          className={`${COLS} text-[11px] font-semibold text-content/50 border-b border-content/20 pb-1 flex-shrink-0`}
        >
          <div>#</div>
          <div>Item / UPC</div>
          <div>Description</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Unit</div>
          <div className="text-right">Allowance</div>
          <div className="text-right">Ext</div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="text-[12px] text-content/45 py-3">
              No line items were read from this invoice.
            </div>
          ) : (
            lines.map((line, i) => (
              <div
                key={i}
                className={`${COLS} text-[12.5px] text-content py-1 border-b border-gray-100 last:border-0`}
              >
                <div className="text-content/40">{i + 1}</div>
                <div className="truncate">
                  {printed(line.itemCode ?? line.upc)}
                </div>
                <div className="truncate">
                  {printed(line.description)}
                  {(line.pack || line.size) && (
                    <span className="text-content/40">
                      {" "}
                      {[line.pack, line.size].filter(Boolean).join(" / ")}
                    </span>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  {printed(line.qty)}
                </div>
                <div className="text-right tabular-nums">
                  {printed(line.unitPrice)}
                </div>
                <div className="text-right tabular-nums">
                  {printed(line.allowance)}
                </div>
                <div
                  className={`text-right tabular-nums font-medium ${
                    isNegative(line.ext) ? "text-severity_critical_text" : ""
                  }`}
                >
                  {printed(line.ext)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPanel;
