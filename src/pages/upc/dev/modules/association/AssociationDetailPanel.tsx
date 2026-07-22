import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import CtaInsightStrip from "../../components/CtaInsightStrip";
import KpiTileGrid from "../../components/KpiTileGrid";
import type { KpiCell } from "../../types";
import type { AssociationItem, AssociationResult } from "../../../../../features/upcDevSlice";
import { getSeedDepartments, groupAssociationItems, type AttachRateDelta } from "./associationStats";
import AssociationResultRow from "./AssociationResultRow";

export type AssociationDeltaContext = {
  prevSeedCount: number;
  changeNote: string;
  deltas: AttachRateDelta[];
  disappeared: AssociationItem[];
};

interface Props {
  result: AssociationResult;
  title: string;
  isReroot: boolean;
  prevTotalBaskets?: number;
  deltaContext: AssociationDeltaContext | null;
  onReroot: (upc: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
}

const AssociationDetailPanel = ({
  result,
  title,
  isReroot,
  prevTotalBaskets,
  deltaContext,
  onReroot,
  onContextMenu,
}: Props) => {
  const seedDepartments = getSeedDepartments(result.items);
  const { similar, alongside } = groupAssociationItems(result.items, seedDepartments);
  const topCompanion = [...alongside, ...similar].sort((a, b) => b.attach_rate - a.attach_rate)[0];
  const departmentCount = new Set(result.items.map((i) => i.sub_department)).size;
  const deltaByCode = new Map(deltaContext?.deltas.map((d) => [d.item.product_code, d]) ?? []);

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
    { label: "Similar items", value: String(similar.length) },
  ];

  const rowNote = (item: AssociationItem): string | undefined => {
    const delta = deltaByCode.get(item.product_code);
    if (!delta || !delta.changed) return undefined;
    return `was ${delta.prevRate.toFixed(1)}% with ${deltaContext!.prevSeedCount} items`;
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-auto thin-scrollbar">
      {deltaContext && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-gray-200 flex items-start gap-2">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[12px] font-semibold text-amber-700">{deltaContext.changeNote}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              {deltaContext.deltas.filter((d) => d.changed).length} companion
              {deltaContext.deltas.filter((d) => d.changed).length === 1 ? "" : "s"} shifted noticeably
              {deltaContext.disappeared.length > 0
                ? `, and ${deltaContext.disappeared.length} no longer show${deltaContext.disappeared.length === 1 ? "s" : ""} up at all`
                : ""}
              .
            </div>
          </div>
        </div>
      )}

      <CtaInsightStrip title={title} insight={insight} tone="muted" />
      <KpiTileGrid items={kpis} />

      <div className="px-4 py-3.5">
        {similar.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-gray-200 px-2 py-1.5 mb-1">
              Similar items
            </div>
            {similar.map((item) => (
              <AssociationResultRow
                key={item.product_code}
                item={item}
                deltaNote={rowNote(item)}
                onReroot={onReroot}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}

        {alongside.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-gray-200 px-2 py-1.5 mb-1">
              Bought alongside · other departments
            </div>
            {alongside.map((item) => (
              <AssociationResultRow
                key={item.product_code}
                item={item}
                showDepartmentTag
                deltaNote={rowNote(item)}
                onReroot={onReroot}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}

        {deltaContext && deltaContext.disappeared.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {deltaContext.disappeared.map((item) => (
              <div key={item.product_code} className="px-2.5 py-2 rounded border border-dashed border-gray-300 bg-gray-50">
                <span className="text-[11.5px] text-content/85">
                  <span className="font-semibold text-content">{item.product_description}</span> no longer appears —
                  it was only associated through {deltaContext.changeNote.replace(/^You (removed|added) /, "")}.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationDetailPanel;
