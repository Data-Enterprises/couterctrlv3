// Utils
import { CTA_SEVERITY_CLASSES } from "../../../../../../utils/severity";

// Interfaces
import type { buildInsight, ItemMarginRow } from "../../../../../../utils/itemMargins";

// Components
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";

interface ItemInsightBarProps {
  selectedItem: ItemMarginRow;
  selectedInsight: ReturnType<typeof buildInsight> | null;
  insightOpen: boolean;
  setInsightOpen: (fn: (v: boolean) => boolean) => void;
}

/** The open item's name, coloured by its grade; a click shows the insight.
 *  Plain when there is no insight to give. */
const ItemInsightBar = ({
  selectedItem,
  selectedInsight,
  insightOpen,
  setInsightOpen,
}: ItemInsightBarProps) => {
  return (
    <>
    {selectedInsight ? (
      <div
        className={`relative border-b ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
      >
        <button
          onClick={() => setInsightOpen((v) => !v)}
          className={`w-full flex items-center gap-1.5 px-4 py-2 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].hoverBg} transition-colors`}
        >
          {selectedInsight.sev === "critical" && (
            <ExclamationTriangleIcon
              className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
            />
          )}
          {selectedInsight.sev === "watch" && (
            <ExclamationCircleIcon
              className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
            />
          )}
          {selectedInsight.sev === "healthy" && (
            <CheckCircleIcon
              className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
            />
          )}
          <span
            className={`text-[13px] font-semibold truncate ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
          >
            {selectedItem.description}
            <span className="ml-2 font-normal text-[11px] tabular-nums">
              {selectedItem.productCode}
            </span>
          </span>
          <span className="flex-1" />
          {insightOpen ? (
            <ChevronUpIcon
              className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
            />
          ) : (
            <ChevronDownIcon
              className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
            />
          )}
        </button>
        {insightOpen && (
          <div
            className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
          >
            <div
              className={`text-[12.5px] font-medium mb-1 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
            >
              {selectedInsight.headline}
            </div>
            <div
              className={`text-[11px] leading-relaxed ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
            >
              {selectedInsight.detail}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-[14px] font-medium text-content truncate">
          {selectedItem.description}
        </span>
        <span className="text-[11px] text-content tabular-nums flex-shrink-0">
          {selectedItem.productCode}
        </span>
      </div>
    )}
    </>
  );
};

export default ItemInsightBar;
