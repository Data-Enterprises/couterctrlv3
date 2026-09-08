import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChartPieIcon,
} from "@heroicons/react/20/solid";
import type { LpCaseView } from "../../../features/lpActionsSlice";
import { severityHeaderBgClass, type Severity } from "../../../utils/severity";
import type { CaseCore } from "./caseModel";

/**
 * Who this case is about, and which half of it is open.
 *
 * The exception, its multiplier and its verdict all live below, on the tab and
 * in the summary, and they change as the reader moves between tabs. The week's
 * numbers live below too, in the KPI strip. What is left here is identity, the
 * switch between the case and the rows behind it, and the one control that
 * leaves this report: the connection plot, which is about the whole operator
 * rather than the tab currently open.
 */
interface Props {
  core: CaseCore;
  onBack: () => void;
  backLabel: string;
  onOpenPlot: () => void;
  view: LpCaseView;
  onView: (v: LpCaseView) => void;
}

/**
 * One button, not a two-state switch.
 *
 * The case is read before its evidence, every time — so the control is a
 * destination ("open the rows behind this") rather than a pair of equal tabs
 * asking the reader to choose which half they want first.
 */
const NEXT: Record<
  LpCaseView,
  { to: LpCaseView; label: string; hint: string }
> = {
  case: {
    to: "evidence",
    label: "Evidence",
    hint: "The receipts and items behind this, and the export",
  },
  evidence: {
    to: "case",
    label: "Back to case",
    hint: "Who, which weeks, and what the numbers point at",
  },
};

/** The case's own verdict tints its header, the way a store's severity tints
 *  the Sales detail panel. Navy is the LEFT panel's colour in this app; a
 *  right panel that never changes says the same thing about every cashier. */
const SEV_OF: Record<string, Severity> = {
  investigate: "critical",
  watch: "watch",
  steady: "healthy",
};

const CaseHeader = ({
  core,
  onBack,
  backLabel,
  onOpenPlot,
  view,
  onView,
}: Props) => (
  <div
    className={`flex-shrink-0 px-4 py-2 flex items-center gap-3 ${
      severityHeaderBgClass[SEV_OF[core.all.severity] ?? "healthy"]
    }`}
  >
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

    {/* Two reads of one case, not two pages. The roster beside them does not
        move, so stepping through never costs the reader their place. */}
    <button
      onClick={() => onView(NEXT[view].to)}
      title={NEXT[view].hint}
      className={`flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        view === "case"
          ? "bg-custom-white text-content hover:opacity-90"
          : "border border-custom-white/30 text-custom-white hover:bg-custom-white/10"
      }`}
    >
      {view === "evidence" && <ArrowLeftIcon className="w-3.5 h-3.5" />}
      {NEXT[view].label}
      {view === "case" && <ArrowRightIcon className="w-3.5 h-3.5" />}
    </button>

    <button
      onClick={onOpenPlot}
      title="Every type and lane this cashier touched, as a link chart"
      className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded border border-custom-white/30 text-custom-white hover:bg-custom-white/10 transition-colors"
    >
      <ChartPieIcon className="w-3.5 h-3.5" />
      Plot
    </button>
  </div>
);

export default CaseHeader;
