import { formatCurrency2 } from "../../../../../utils";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { PriceOptRowSummary } from "./priceOptStats";
import { getPriceOptPhrase, getPriceOptInsight } from "./priceOptPhrase";
import PriceOptPricePointsTable from "./PriceOptPricePointsTable";

interface Props {
  summary: PriceOptRowSummary;
}

const PriceOptDetailPanel = ({ summary: r }: Props) => {
  const phrase = getPriceOptPhrase(r.points, r.elasticity);
  const insight = getPriceOptInsight(r.points, r.elasticity);

  const kpis: KpiCell[] = [
    { label: "Best price", value: formatCurrency2(r.bestPrice) },
    { label: "Best revenue", value: formatCurrency2(r.bestRevenue) },
    { label: "Elasticity", value: r.elasticity !== null ? r.elasticity.toFixed(1) : "—" },
    { label: "Price points tested", value: String(r.points.length) },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      <CtaInsightStrip title={r.desc} insight={insight} tone={phrase.tone} />
      <KpiTileGrid items={kpis} />

      <div className="px-4 py-3.5">
        {r.points.length === 0 ? (
          <div className="text-[13px] text-content/85 italic py-2">
            No price history available for this item.
          </div>
        ) : (
          <PriceOptPricePointsTable points={r.points} bestPrice={r.bestPrice} />
        )}
      </div>
    </div>
  );
};

export default PriceOptDetailPanel;
