// Hooks
import { useState } from "react";

// Interfaces
import type {
  buildInsight,
  buildItemDetail,
  ItemMarginRow,
  ItemGradingMetric,
} from "../../../../../../utils/itemMargins";
import type { ReportRow } from "../interfaces";

// Components
import ItemInsightBar from "./ItemInsightBar";
import ItemMetricCards from "./ItemMetricCards";
import ItemDayTrend from "./ItemDayTrend";

interface ItemReportProps {
  selectedItem: ItemMarginRow | null;
  selectedInsight: ReturnType<typeof buildInsight> | null;
  selectedDetail: ReturnType<typeof buildItemDetail> | null;
  reportRows: ReportRow[];
  thresholdAmt: number;
  gradingMetric: ItemGradingMetric;
}

/** The right side: the open item's insight, its metrics and its week. */
const ItemReport = ({
  selectedItem,
  selectedInsight,
  selectedDetail,
  reportRows,
  thresholdAmt,
  gradingMetric,
}: ItemReportProps) => {
  const [insightOpen, setInsightOpen] = useState(false);
  return (
    <div
      className="flex-1 min-w-0 overflow-y-auto thin-scrollbar"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {!selectedItem ? (
        <div className="flex items-center justify-center h-full text-[12px] text-content">
          Select an item to see its report
        </div>
      ) : (
        <>
          <ItemInsightBar
            selectedItem={selectedItem}
            selectedInsight={selectedInsight}
            insightOpen={insightOpen}
            setInsightOpen={setInsightOpen}
          />
          <ItemMetricCards reportRows={reportRows} thresholdAmt={thresholdAmt} />
          <ItemDayTrend
            selectedDetail={selectedDetail}
            thresholdAmt={thresholdAmt}
            gradingMetric={gradingMetric}
          />
        </>
      )}
    </div>
  );
};

export default ItemReport;
