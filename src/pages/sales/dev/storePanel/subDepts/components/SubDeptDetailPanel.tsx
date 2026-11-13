// Hooks
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useAppDispatch } from "../../../../../../hooks";
import { useSalesCtx } from "../../../hooks";

// Redux
import {
  setExportSubDeptName,
  setExportSubDeptItems,
} from "../../../../../../features/dev/devSalesLedgerSlice";

// Utils
import { itemSeverity } from "../../../../../../utils/itemGrading";
import { getCta, isNarrowed, listItems, listLabel, nextItemSort, pickItems, sameFilter, sortItems } from "../utils";

// Interfaces
import type { SevFilter } from "../../../utils/index";
import type { Coverage } from "../../../utils/ledgerUtils";
import type { DeptRow, ItemMenu, ItemSortColumn, ItemSortState, ListFilter } from "../interfaces";

// Components
import UpcContextMenu from "../../../../../../components-dev/UpcContextMenu";
import InsightToggle from "../../../components/InsightToggle";
import PeriodKpis from "../../../components/PeriodKpis";
import ItemsToolbar from "./ItemsToolbar";
import ItemsTable from "./ItemsTable";
import ListActions from "./ListActions";
import CompareSlideOver from "../compare/CompareSlideOver";

interface SubDeptDetailPanelProps {
  /** The open sub department, or null when none is picked. */
  selected: DeptRow | null;
  coverage: Coverage;
  threshold: number;
  itemsLoading: boolean;
  twDateLabel: string;
  lwDateLabel: string;
  lyDateLabel: string;
  ctaOpen: boolean;
  setCtaOpen: Dispatch<SetStateAction<boolean>>;
  itemSevFilter: SevFilter;
  setItemSevFilter: (v: SevFilter) => void;
  itemTextFilter: string;
  setItemTextFilter: (v: string) => void;
  itemActiveFilter: string;
  setItemActiveFilter: (v: string) => void;
  itemSort: ItemSortState;
  setItemSort: Dispatch<SetStateAction<ItemSortState>>;
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
  ctaOpen,
  setCtaOpen,
  itemSevFilter,
  setItemSevFilter,
  itemTextFilter,
  setItemTextFilter,
  itemActiveFilter,
  setItemActiveFilter,
  itemSort,
  setItemSort,
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

  const [ctxMenu, setCtxMenu] = useState<ItemMenu>(null);
  // The list kept as A to compare against, and the compare panel's open flag.
  // Both go with the department: another one starts clean.
  const [pinned, setPinned] = useState<ListFilter | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  // Items the drawer sent to the list ("Show in the item list"): they stand in
  // for the filters until a filter changes or the chip's x drops them.
  const [focus, setFocus] = useState<{ label: string; upcs: string[] } | null>(null);

  useEffect(() => {
    setPinned(null);
    setCompareOpen(false);
  }, [selectedId]);

  useEffect(() => {
    setFocus(null);
  }, [selectedId, itemSevFilter, itemTextFilter, itemActiveFilter]);

  // Active and inactive graded once each, so A and the list can pick their own.
  const gradedActive = useMemo(
    () => items.map((item) => ({ ...item, sev: itemSeverity(item, itemThreshold, gradingMetric, coverage) })),
    [items, itemThreshold, gradingMetric, coverage],
  );
  const gradedInactive = useMemo(
    () => inactiveItems.map((item) => ({ ...item, sev: itemSeverity(item, itemThreshold, gradingMetric, coverage) })),
    [inactiveItems, itemThreshold, gradingMetric, coverage],
  );

  const itemsWithSev = useMemo(
    () => pickItems(gradedActive, gradedInactive, itemActiveFilter),
    [gradedActive, gradedInactive, itemActiveFilter],
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

  const current: ListFilter = { sev: itemSevFilter, text: itemTextFilter, active: itemActiveFilter };
  const filteredItems = listItems(gradedActive, gradedInactive, current);
  const textFilteredItems = focus
    ? pickItems(gradedActive, gradedInactive, "").filter((i) => focus.upcs.includes(i.upc))
    : filteredItems;
  const sortedItems = sortItems(textFilteredItems, itemSort);
  const narrowed = isNarrowed(itemSevFilter, itemTextFilter, itemActiveFilter);
  const shownUpcs = sortedItems.map((i) => i.upc);
  const pinnedItems = pinned ? listItems(gradedActive, gradedInactive, pinned) : [];

  const cta = selected ? getCta(selected, coverage, threshold, gradingMetric) : null;

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {selected && cta && (
        <InsightToggle
          name={selected.desc}
          cta={cta}
          open={ctaOpen}
          onToggle={() => setCtaOpen((v) => !v)}
        />
      )}

      {selected ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <PeriodKpis
            row={selected}
            coverage={coverage}
            threshold={threshold}
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
          />

          <div
            className="flex flex-col flex-1 overflow-hidden border-b border-line_hair leading-snug"
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
            {(narrowed || pinned || focus) && (
              <ListActions
                shownUpcs={shownUpcs}
                focus={focus && { label: focus.label, count: textFilteredItems.length }}
                onClearFocus={() => setFocus(null)}
                pinned={pinned && { label: listLabel(pinned), count: pinnedItems.length }}
                canCompare={!!pinned && !sameFilter(pinned, current)}
                onPin={() => setPinned(current)}
                onUnpin={() => {
                  setPinned(null);
                  setCompareOpen(false);
                }}
                onCompare={() => setCompareOpen(true)}
              />
            )}

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

      {/* Nothing between here and StoreDetailPopup's tab area is positioned, so
          the drawer covers the report tabs and their content. */}
      {selected && pinned && (
        <CompareSlideOver
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          onShow={(label, upcs) => {
            setFocus({ label, upcs });
            setCompareOpen(false);
          }}
          deptName={selected.desc}
          a={{ filter: pinned, items: pinnedItems }}
          b={{ filter: current, items: filteredItems }}
          twDateLabel={twDateLabel}
          threshold={itemThreshold}
        />
      )}

      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          shownUpcs={narrowed ? shownUpcs : undefined}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
};

export default SubDeptDetailPanel;
