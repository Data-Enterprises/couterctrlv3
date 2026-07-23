import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { AssociationResult } from "../../../../../features/upcDevSlice";
import { getDisplayItems } from "./associationStats";
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
  const topCompanion = [...items].sort((a, b) => b.attach_rate - a.attach_rate)[0];
  const departmentCount = new Set(items.map((i) => i.sub_department)).size;

  const insight = isReroot
    ? `This is a fresh lookup, not a slice of your seed search — ${result.totalBaskets.toLocaleString()} baskets contained ${title}${
        prevTotalBaskets != null ? ` (your seed search had ${prevTotalBaskets.toLocaleString()})` : ""
      }.`
    : `${result.totalBaskets.toLocaleString()} baskets contained at least one of your seed items.${
        topCompanion
          ? ` The strongest pairing is ${topCompanion.product_description}, showing up in ${topCompanion.attach_rate.toFixed(1)}% of those baskets.`
          : ""
      }`;

  const kpis: KpiCell[] = [
    { label: "Baskets analyzed", value: result.totalBaskets.toLocaleString() },
    {
      label: "Top companion",
      value: topCompanion?.product_description ?? "—",
      sub: topCompanion ? `${topCompanion.attach_rate.toFixed(1)}%` : undefined,
      subVariant: topCompanion ? "neutral" : undefined,
    },
    { label: "Departments", value: String(departmentCount) },
    { label: "Companions found", value: String(items.length) },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      <CtaInsightStrip title={title} insight={insight} tone="muted" />
      <KpiTileGrid items={kpis} />

      <div className="px-4 py-3.5">
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
