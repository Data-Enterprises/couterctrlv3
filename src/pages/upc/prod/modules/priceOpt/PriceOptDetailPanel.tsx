import { formatCurrency2 } from "../../../../../utils";
import { formatPricedUnits } from "../../../../../utils/pricedUnits";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { PriceOptRowSummary } from "./priceOptStats";
import { getPriceOptPhrase, getPriceOptInsight } from "./priceOptPhrase";
import PriceOptPricePointsTable from "./PriceOptPricePointsTable";

interface Props {
  summary: PriceOptRowSummary;
  fixes: boolean;
}

const PriceOptDetailPanel = ({ summary: r, fixes }: Props) => {
  const phrase = getPriceOptPhrase(r.points, r.elasticity);
  const insight = getPriceOptInsight(r.points, r.elasticity);

  const kpis: KpiCell[] = [
    // "$3.99" on a scale item is a price per pound, and without the unit it
    // reads as what one package costs.
    {
      label: "Best price",
      value: `${formatCurrency2(r.bestPrice)}${r.weighted ? "/lb" : ""}`,
    },
    { label: "Best revenue", value: formatCurrency2(r.bestRevenue) },
    // A new tile, so it exists only behind the flag — on prod the strip keeps
    // the four it had.
    ...(fixes
      ? [
          {
            label: r.weighted ? "Volume at best" : "Qty at best",
            value: formatPricedUnits(r.bestUnits, r.weighted ? r.bestUnits : 0),
          },
        ]
      : []),
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
          <PriceOptPricePointsTable
            points={r.points}
            bestPrice={r.bestPrice}
            weighted={r.weighted}
          />
        )}
      </div>
    </div>
  );
};

export default PriceOptDetailPanel;
