// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import {
  setExportSubDeptName,
  setExportSubDeptItems,
} from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { itemSeverity } from "../../../../../../utils/itemGrading";
import { getCta, nextItemSort, searchItems, sortItems } from "../utils";

// Interfaces
import type { SevFilter } from "../../../utils/index";
import type { Coverage } from "../../../utils/ledgerUtils";
import type { DeptRow, ItemMenu, ItemSortColumn, ItemSortState } from "../interfaces";

// Components
import UpcContextMenu from "../../../../../../components-dev/UpcContextMenu";
import SubDeptInsight from "./SubDeptInsight";
import SubDeptKpis from "./SubDeptKpis";
import ItemsToolbar from "./ItemsToolbar";
import ItemsTable from "./ItemsTable";

interface SubDeptDetailPanelProps {
  /** The open sub department, or null when none is picked. */
  selected: DeptRow | null;
  coverage: Coverage;
  threshold: number;
  itemsLoading: boolean;
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
}

/**
 * The right panel: the open sub department's insight, its three figures and
 * its items. Stays mounted while the tab is open, so the item filters and sort
 * survive picking another sub department.
 */
const SubDeptDetailPanel = ({
  selected,
  coverage,
  threshold,
  itemsLoading,
  twDateLabel,
  lwDateLabel,
  lyDateLabel,
}: SubDeptDetailPanelProps) => {
  const dispatch = useAppDispatch();
  const {
    gradingMetric,
    itemThreshold: rawItemThreshold,
    selectedSubDeptId: selectedId,
    selectedSubDeptItems: items,
    inactiveSubDeptItems: inactiveItems,
  } = useSalesCtx();

  // A cleared threshold box keeps grading on the last valid amount, so rows do
  // not move until a new number is typed.
  const itemThresholdRef = useRef<number>(rawItemThreshold ?? 9);
  if (rawItemThreshold != null) itemThresholdRef.current = rawItemThreshold;
  const itemThreshold = itemThresholdRef.current;

  const [ctaOpen, setCtaOpen] = useState(false);
  const [itemSevFilter, setItemSevFilter] = useState<SevFilter>("all");
  const [itemTextFilter, setItemTextFilter] = useState("");
  // "" shows active and inactive together: the question is almost always
  // "what sold here", not "what still sells".
  const [itemActiveFilter, setItemActiveFilter] = useState("");
  const [itemSort, setItemSort] = useState<ItemSortState>(null);
  const [ctxMenu, setCtxMenu] = useState<ItemMenu>(null);

  useEffect(() => {
    setItemSevFilter("all");
  }, [selectedId]);

  const baseItems = useMemo(
    () =>
      itemActiveFilter === "inactive"
        ? inactiveItems
        : itemActiveFilter === "active"
          ? items
          : [...items, ...inactiveItems],
    [itemActiveFilter, items, inactiveItems],
  );

  const itemsWithSev = useMemo(
    () =>
      baseItems.map((item) => ({
        ...item,
        sev: itemSeverity(item, itemThreshold, gradingMetric, coverage),
      })),
    [baseItems, itemThreshold, gradingMetric, coverage],
  );

  useEffect(() => {
    dispatch(setExportSubDeptName(selected?.desc ?? ""));
    dispatch(setExportSubDeptItems(selected ? itemsWithSev : []));
  }, [itemsWithSev, selectedId]);

  const counts = {
    critical: itemsWithSev.filter((i) => i.sev === "critical").length,
    watch: itemsWithSev.filter((i) => i.sev === "watch").length,
    healthy: itemsWithSev.filter((i) => i.sev === "healthy").length,
  };

  // Independent of the active chip, so the menu's "copy critical/watch/healthy"
  // always means the same thing.
  const allUpcs = useMemo(() => itemsWithSev.map((i) => i.upc), [itemsWithSev]);
  const severityUpcs = useMemo(
    () => ({
      critical: itemsWithSev.filter((i) => i.sev === "critical").map((i) => i.upc),
      watch: itemsWithSev.filter((i) => i.sev === "watch").map((i) => i.upc),
      healthy: itemsWithSev.filter((i) => i.sev === "healthy").map((i) => i.upc),
    }),
    [itemsWithSev],
  );

  const visibleItems =
    itemSevFilter === "all"
      ? itemsWithSev
      : itemsWithSev.filter((i) => i.sev === itemSevFilter);
  const textFilteredItems = searchItems(visibleItems, itemTextFilter);
  const sortedItems = sortItems(textFilteredItems, itemSort);

  const cta = selected ? getCta(selected, coverage, threshold, gradingMetric) : null;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {selected && cta && (
        <SubDeptInsight
          name={selected.desc}
          cta={cta}
          open={ctaOpen}
          onToggle={() => setCtaOpen((v) => !v)}
        />
      )}

      {selected ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <SubDeptKpis
            row={selected}
            coverage={coverage}
            threshold={threshold}
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
          />

          <div
            className="flex flex-col flex-1 overflow-hidden border-b border-gray-100 leading-snug"
            onContextMenu={(e) => {
              e.preventDefault();
              setCtxMenu({ x: e.clientX, y: e.clientY, upc: "" });
            }}
          >
            <ItemsToolbar
              sevFilter={itemSevFilter}
              onSevFilter={setItemSevFilter}
              counts={counts}
              text={itemTextFilter}
              onText={setItemTextFilter}
              activeFilter={itemActiveFilter}
              onActiveFilter={setItemActiveFilter}
            />

            {itemsLoading ? (
              <div className="px-4 py-3 text-[11px] text-content">Loading…</div>
            ) : textFilteredItems.length === 0 ? (
              <div className="px-4 py-3 text-[11px] text-content">No data</div>
            ) : (
              <ItemsTable
                items={sortedItems}
                sort={itemSort}
                onSort={(column: ItemSortColumn) =>
                  setItemSort((prev) => nextItemSort(prev, column))
                }
                onItemMenu={(e, upc) => setCtxMenu({ x: e.clientX, y: e.clientY, upc })}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-[12px] text-content">
          Select a sub department
        </div>
      )}

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

export default SubDeptDetailPanel;
