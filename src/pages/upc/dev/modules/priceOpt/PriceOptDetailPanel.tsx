import { formatCurrency2 } from "../../../../../utils";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { PriceOptRowSummary } from "./priceOptStats";
import {
  getPriceOptPhrase,
  getPreStorePhrase,
  getPriceOptInsight,
  getPreStoreInsight,
} from "./priceOptPhrase";
import PriceOptStorePicker from "./PriceOptStorePicker";
import PriceOptPricePointsTable from "./PriceOptPricePointsTable";

interface Props {
  summary: PriceOptRowSummary;
  isGroupSearch: boolean;
}

const PriceOptDetailPanel = ({ summary: r, isGroupSearch }: Props) => {
  const phrase = r.isChecked ? getPriceOptPhrase(r.status!, r.risk!) : getPreStorePhrase(r.points, r.elasticity);
  const insight = r.isChecked
    ? getPriceOptInsight(r.status!, r.risk!, r.currentPrice, r.bestPrice)
    : getPreStoreInsight(r.points, r.elasticity);

  const kpis: KpiCell[] = r.isChecked
    ? [
        { label: "Current price", value: r.currentPrice !== null ? formatCurrency2(r.currentPrice) : "—" },
        { label: "Current cost", value: r.currentCost !== null ? formatCurrency2(r.currentCost) : "—" },
        { label: "Best price", value: formatCurrency2(r.bestPrice) },
        {
          label: "Profit at risk",
          value: r.risk!.status === "ok" ? `+${formatCurrency2(r.risk!.profitAtRisk)} est.` : "—",
          variant: r.risk!.status === "ok" ? "up" : undefined,
        },
        { label: "Elasticity", value: r.elasticity !== null ? r.elasticity.toFixed(1) : "—" },
      ]
    : [
        { label: "Best price", value: formatCurrency2(r.bestPrice) },
        { label: "Elasticity", value: r.elasticity !== null ? r.elasticity.toFixed(1) : "—" },
        { label: "Price points tested", value: String(r.points.length) },
      ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      <CtaInsightStrip title={r.desc} insight={insight} tone={phrase.tone} />
      {isGroupSearch && <PriceOptStorePicker />}
      <KpiTileGrid items={kpis} />

      <div className="px-4 py-3.5">
        {r.points.length === 0 ? (
          <div className="text-[13px] text-content/85 italic py-2">
            No price history available for this item.
          </div>
        ) : (
          <PriceOptPricePointsTable
            points={r.points}
            bestPrice={r.bestPrice}
            currentPrice={r.currentPrice}
            currentCost={r.currentCost}
          />
        )}
      </div>
    </div>
  );
};

export default PriceOptDetailPanel;
