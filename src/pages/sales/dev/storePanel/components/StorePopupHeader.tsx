// Hooks
import { useCanSeeComingSoon } from "../../../../../hooks";
import { useCriticalReport } from "../../../../../hooks/useCriticalReport";
import { useSalesCtx } from "../../hooks";
import { useStoreNames, useWeekWindow } from "../hooks";

// Utils
import { severityHeaderBgClass } from "../../utils/index";

// Interfaces
import type { StoreSelection } from "../../components/LedgerRow";

// Components
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/20/solid";
import PopupTipButton from "./PopupTipButton";

interface StorePopupHeaderProps {
  selection: StoreSelection;
  loading: boolean;
  onExport: () => void;
}

/** The store panel's title bar, tinted to the store's grade, with the item
 *  actions and export buttons. */
const StorePopupHeader = ({ selection, loading, onExport }: StorePopupHeaderProps) => {
  // Item Actions is unreleased, so the way in goes with it. A button that
  // navigates somewhere the nav says does not exist is worse than no button.
  const canSeeComingSoon = useCanSeeComingSoon();
  const openCriticalReport = useCriticalReport();
  const { counterpart, gradingMetric, rawSubs, rawHourly, itemThreshold: rawItemThreshold } =
    useSalesCtx();
  // The same item threshold the sub-dept list grades against, so the button's
  // definition of critical is the one already on screen.
  const itemThreshold = rawItemThreshold ?? 9;
  const { resolvedStoreName, headerStoreName } = useStoreNames(selection);
  const { twStart, twEnd } = useWeekWindow();

  return (
    <div
      className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${
        // Navy when the store wasn't graded: tinting it would claim a verdict.
        selection.severity ? severityHeaderBgClass[selection.severity] : "bg-brand_navy"
      }`}
    >
      <p className="text-custom-white text-[14px] font-bold leading-tight justify-self-start">
        {headerStoreName}
      </p>
      <span className="text-custom-white text-[14px] font-bold justify-self-center truncate">
        {counterpart ? `${headerStoreName} vs ${counterpart.storeName}` : "Weekly Performance"}
      </span>
      <div className="flex items-center gap-3 justify-self-end">
        {/* Whole-store critical report. Nothing is fetched here: the rule
            travels with the handoff and the report resolves it on its own
            loading screen. */}
        {canSeeComingSoon && !loading && rawSubs.length > 0 && (
          <PopupTipButton
            label="See item actions"
            onClick={() =>
              openCriticalReport({
                storeId: selection.storeId,
                grade: {
                  kind: "sales",
                  threshold: itemThreshold,
                  metric: gradingMetric,
                  storeNumber: selection.storeNumber,
                },
                window: { start: twStart, end: twEnd },
                sourceLabel: resolvedStoreName,
                basisLabel: `critical by ${gradingMetric}, ${itemThreshold}%`,
              })
            }
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
          </PopupTipButton>
        )}
        {!loading && (rawSubs.length > 0 || rawHourly.length > 0) && (
          <PopupTipButton label="Export CSV" onClick={onExport}>
            <ArrowDownTrayIcon className="w-4 h-4" />
          </PopupTipButton>
        )}
      </div>
    </div>
  );
};

export default StorePopupHeader;
