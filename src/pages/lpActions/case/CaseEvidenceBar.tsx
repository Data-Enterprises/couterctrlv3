import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { downloadCsv } from "../../../utils/csvExport";
import { caseCsv, caseFilename, type CaseExportScope } from "./caseExport";
import type { TransactionListItem } from "../../../interfaces";

/**
 * What the rows below are, and the file they come out as.
 *
 * The scope is spelled out rather than assumed. Every figure here is already
 * narrowed three ways — one cashier, one week, one exception type — and a
 * reader who forgets any of them draws a much bigger conclusion than the rows
 * support. It reads as a sentence for the same reason it is exported: this is
 * what somebody would have to write at the top of the page if they printed it.
 */
interface Props {
  lines: TransactionListItem[];
  receipts: number;
  scope: CaseExportScope;
  loading: boolean;
}

const CaseEvidenceBar = ({ lines, receipts, scope, loading }: Props) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-[#1e2a4a]/15">
    <div className="min-w-0 flex-1">
      <p className="text-[13px] text-content truncate">
        <span className="font-semibold">{scope.weekLabel}</span> &middot;{" "}
        {scope.cashierName} &middot; {scope.saleType}
      </p>
      <p className="text-[12px] text-content/85 truncate">
        {loading
          ? "Reading the receipts…"
          : `${receipts} ${receipts === 1 ? "receipt" : "receipts"}, ${lines.length} ${
              lines.length === 1 ? "line" : "lines"
            }`}
      </p>
    </div>

    <button
      onClick={() => downloadCsv(caseCsv(lines, scope), caseFilename(scope))}
      disabled={lines.length === 0}
      title="Every line below, as a spreadsheet"
      className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#1e2a4a] text-custom-white hover:opacity-90 disabled:opacity-40 transition-opacity"
    >
      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
      Export rows
    </button>
  </div>
);

export default CaseEvidenceBar;
