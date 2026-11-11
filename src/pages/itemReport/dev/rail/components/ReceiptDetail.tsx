// Hooks
import { useAppDispatch } from "../../../../../hooks";

// Redux
import { openItemReportInvoice } from "../../../../../features/dev/devItemReportSlice";

// Utils
import { formatCurrency2 } from "../../../../../utils";
import { describeReceipt } from "../../utils";

// Interfaces
import type { ReceiptLine } from "../../interfaces";

// Components
import Kpis from "./Kpis";

interface ReceiptDetailProps {
  line: ReceiptLine;
}

/**
 * One delivery, opened up.
 *
 * Everything here is already on the line we keep, so opening a row costs nothing
 * — no fetch, no second call. The collapsed grid answers "what arrived and at
 * what price"; this answers "which invoice, how was it billed, and was any of it
 * free or returned".
 *
 * Vendor is a heading rather than a tile: it is a name of unpredictable length,
 * and a tile is a shape for a number.
 */
const ReceiptDetail = ({ line }: ReceiptDetailProps) => {
  const dispatch = useAppDispatch();

  return (
    <div className="bg-fill_soft border-l-2 border-brand_navy">
      <div className="px-2.5 py-1.5 text-[12px] font-medium text-content truncate">
        {line.vendorName}
      </div>
      <Kpis
        cells={[
          {
            label: "Invoice",
            value: String(line.invoiceId),
            // The invoice number is already the identity of the thing you would
            // open, so it is the button — no extra control to explain.
            onClick: () =>
              dispatch(
                openItemReportInvoice({
                  invoiceId: line.invoiceId,
                  date: line.date,
                  vendorName: line.vendorName,
                  fromUpc: line.productCode,
                }),
              ),
          },
          {
            label: "Ext cost",
            value: formatCurrency2(line.sellingUnits * line.unitCost),
          },
          {
            label: "Ext retail",
            value:
              line.retail > 0
                ? formatCurrency2(line.sellingUnits * line.retail)
                : "—",
          },
        ]}
      />
      <Kpis
        cells={[
          {
            label: "Received as",
            value: describeReceipt(line.sellingUnits, line.cases),
          },
          // Flags, not counts — a line is free goods or it isn't. "Yes" takes
          // the watch tone so the exception is what draws the eye; "No" stays
          // quiet, which is the answer on almost every delivery.
          {
            label: "Free",
            value: line.free > 0 ? "Yes" : "No",
            flagged: line.free > 0,
          },
          {
            label: "Returned",
            value: line.returned > 0 ? "Yes" : "No",
            flagged: line.returned > 0,
          },
        ]}
      />
    </div>
  );
};

export default ReceiptDetail;
