import { ArrowLeftIcon, ChartPieIcon } from "@heroicons/react/20/solid";
import type { CaseCore } from "./caseModel";

/**
 * Who this case is about — the operator, not the exception.
 *
 * The exception, its multiplier and its verdict all live below, on the tab and
 * in the summary, and they change as the reader moves between tabs. The week's
 * numbers live below too, in the KPI strip. What is left here is identity, and
 * the one control that leaves this report: the connection plot, which is about
 * the whole operator rather than the tab currently open.
 */
interface Props {
  core: CaseCore;
  onBack: () => void;
  backLabel: string;
  onOpenPlot: () => void;
}

const CaseHeader = ({ core, onBack, backLabel, onOpenPlot }: Props) => (
  <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2 flex items-center gap-3">
    <button
      onClick={onBack}
      title={`Back to ${backLabel}`}
      className="flex-shrink-0 p-1 -ml-1 rounded text-custom-white/85 hover:text-custom-white hover:bg-custom-white/10 transition-colors"
    >
      <ArrowLeftIcon className="w-4 h-4" />
    </button>

    <div className="min-w-0 flex-1">
      <p className="text-custom-white text-[13px] font-semibold truncate">
        {core.cashierName}
      </p>
      <p className="text-custom-white/85 text-[12px] truncate">
        Cashier {core.cashierNumber} &middot; {core.storeName}
      </p>
    </div>

    <button
      onClick={onOpenPlot}
      title="Every type and lane this cashier touched, as a link chart"
      className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded border border-custom-white/30 text-custom-white hover:bg-custom-white/10 transition-colors"
    >
      <ChartPieIcon className="w-3.5 h-3.5" />
      Connection plot
    </button>
  </div>
);

export default CaseHeader;
