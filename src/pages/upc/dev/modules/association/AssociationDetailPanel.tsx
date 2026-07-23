import { formatCurrency2 } from "../../../../../utils";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { AssociationResult } from "../../../../../features/upcDevSlice";
import {
  getDisplayItems,
  getDepartmentBreakdown,
  getQueryDepartments,
  splitDeptBreakdown,
  sumGroupRevenue,
  getTotalRevenue,
  getAvgRevenuePerBasket,
  getTopCompanion,
  getWeightedAvgAttachRate,
} from "./associationStats";
import AssociationItemsTable from "./AssociationItemsTable";

interface Props {
  result: AssociationResult;
  title: string;
  isReroot: boolean;
  rerootUpc: string | null;
  prevTotalBaskets?: number;
  onReroot: (upc: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
}

const AssociationDetailPanel = ({
  result,
  title,
  isReroot,
  rerootUpc,
  prevTotalBaskets,
  onReroot,
  onContextMenu,
}: Props) => {
  const items = getDisplayItems(result.items, rerootUpc);
  const topCompanion = getTopCompanion(items);
  const totalRevenue = getTotalRevenue(items);
  const avgRevenuePerBasket = getAvgRevenuePerBasket(totalRevenue, result.totalBaskets);
  const avgAttachRate = getWeightedAvgAttachRate(items);

  const deptBreakdown = getDepartmentBreakdown(items);
  const queryDepartments = getQueryDepartments(result.items);
  const { cross: crossDepts, same: sameDepts } = splitDeptBreakdown(deptBreakdown, queryDepartments);
  const crossRevenue = sumGroupRevenue(crossDepts);
  const sameRevenue = sumGroupRevenue(sameDepts);

  const DEPT_TONE = {
    cross: {
      caption: "text-amber-800",
      chip: "bg-amber-100 border-amber-200",
      label: "text-amber-900",
      value: "text-amber-800",
    },
    same: {
      caption: "text-blue-800",
      chip: "bg-blue-100 border-blue-200",
      label: "text-blue-900",
      value: "text-blue-800",
    },
  } as const;

  const deptChips = (
    label: string,
    depts: typeof deptBreakdown,
    revenue: number,
    tone: keyof typeof DEPT_TONE,
  ) => {
    const c = DEPT_TONE[tone];
    return (
      <div className="mb-2">
        <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${c.caption}`}>
          {label} · {formatCurrency2(revenue)}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {depts.map((d) => (
            <span
              key={d.deptId}
              className={`inline-flex items-baseline gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] ${c.chip}`}
            >
              <span className={`font-semibold ${c.label}`}>{d.label}</span>
              <span className={c.value}>{d.count}</span>
              <span className={`tabular-nums ${c.value}`}>{formatCurrency2(d.revenue)}</span>
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Numbers throughout are always digits (576, 5, 7), never spelled out —
  // this is generated text pulling from live data, not fixed copy.
  const insight = isReroot ? (
    `This is a fresh lookup, not a slice of your seed search — ${result.totalBaskets.toLocaleString()} baskets contained ${title}${
      prevTotalBaskets != null ? ` (your seed search had ${prevTotalBaskets.toLocaleString()})` : ""
    }.`
  ) : (
    <>
      <p className="mb-1.5">
        {result.totalBaskets.toLocaleString()} baskets contained at least one of your seed items, generating{" "}
        {formatCurrency2(totalRevenue)} in companion revenue across {deptBreakdown.length} sub department
        {deptBreakdown.length === 1 ? "" : "s"}.
      </p>
      {crossDepts.length > 0 && deptChips("Cross Sub Dept", crossDepts, crossRevenue, "cross")}
      {sameDepts.length > 0 && deptChips("Same as seed", sameDepts, sameRevenue, "same")}
      {topCompanion && (
        <p className="mt-0.5">
          The strongest single pairing is {topCompanion.product_description}, showing up in{" "}
          {topCompanion.attach_rate.toFixed(1)}% of those baskets.
        </p>
      )}
    </>
  );

  // Ordered by impact: the one derived "so what" number first, then the
  // specific named finding to act on, then context for how typical that
  // finding is, ending on the sample-size fact everything else depends on.
  const kpis: KpiCell[] = [
    { label: "Avg Revenue", value: formatCurrency2(avgRevenuePerBasket) },
    {
      label: "Top companion",
      value: topCompanion?.product_description ?? "—",
      sub: topCompanion ? `${topCompanion.attach_rate.toFixed(1)}%` : undefined,
      subVariant: topCompanion ? "neutral" : undefined,
    },
    { label: "Avg attach rate", value: `${avgAttachRate.toFixed(1)}%` },
    { label: "Baskets analyzed", value: result.totalBaskets.toLocaleString() },
  ];

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="flex-shrink-0">
        <CtaInsightStrip title={title} insight={insight} tone="muted" />
        <KpiTileGrid items={kpis} />
        {items.length > 0 && (
          <div className="px-4 pt-2 text-[10px] font-medium text-content/85">
            Showing top {items.length} association{items.length === 1 ? "" : "s"} by strength
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-2 pb-3.5">
        {items.length > 0 ? (
          <AssociationItemsTable items={items} onReroot={onReroot} onContextMenu={onContextMenu} />
        ) : (
          <div className="text-[13px] text-content/85 italic py-2">No associations found.</div>
        )}
      </div>
    </div>
  );
};

export default AssociationDetailPanel;
