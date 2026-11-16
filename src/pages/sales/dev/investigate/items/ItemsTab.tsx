// Hooks
import { useMemo, useRef } from "react";
import { useSalesCtx } from "../../hooks";
import { useItemsGrid, useRowSelection } from "../hooks";

// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { SUGGESTED } from "../utils";

// Interfaces
import type { ItemVerdict, Stage, Summary } from "../interfaces";
import type {
  OrdersWave,
  ReceiptsWave,
  SalesWave,
  Window,
} from "../utils/investigationData";

// Components
import CauseChips from "./components/CauseChips";
import EvidenceRail from "./components/EvidenceRail";
import GridBody from "./components/GridBody";
import GridContextMenu from "./components/GridContextMenu";
import GridFoot from "./components/GridFoot";
import GridHead from "./components/GridHead";
import GridPager from "./components/GridPager";
import SupplyWindowNote from "./components/SupplyWindowNote";
import ItemEvidence from "./evidence/ItemEvidence";

interface ItemsTabProps {
  /** On screen: the Items tab is open and sales are in. */
  open: boolean;
  items: ItemVerdict[];
  stage: Stage;
  allIn: boolean;
  summary: Summary;
  /** The supply lookback, for the note under the chips. */
  window: Window;
  sales: SalesWave | null;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** Find the right-clicked rows in the Supply tab. */
  onOpenSupply: (upcs: string) => void;
}

/** The Items tab: the cause chips, the item grid with its pager, and the
 *  evidence rail for the open item. It stays mounted behind `hidden`, so the
 *  grid keeps its scroll when another tab is open. */
const ItemsTab = ({
  open,
  items,
  stage,
  allIn,
  summary,
  window,
  sales,
  orders,
  receipts,
  onOpenSupply,
}: ItemsTabProps) => {
  const { gradingMetric, investigation: target } = useSalesCtx();
  const grid = useItemsGrid(items);
  const { filters, sorted, capped, picked, setPicked, show, at } = grid;
  const { only, setOnly, shown } = filters;
  const selection = useRowSelection(sorted, picked, setPicked, show);
  const { chosen, ctx, setCtx } = selection;

  const isQty = gradingMetric === "qty";
  const fmt = (v: number) =>
    isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  const pickedItem = useMemo(
    () => items.find((i) => i.productCode === picked) ?? null,
    [items, picked],
  );

  /**
   * The last item the rail showed, kept through the close.
   *
   * The rail slides out over 200ms, and unmounting its contents on the frame
   * the selection clears would empty the panel before it has finished moving
   * — the slide would be of a blank box. Written during render deliberately:
   * an effect would run a frame late, which is exactly the frame that shows.
   */
  const lastEvidence = useRef<ItemVerdict | null>(null);
  if (pickedItem) lastEvidence.current = pickedItem;
  const evidence = pickedItem ?? lastEvidence.current;

  if (!target) return null;

  const byCause = new Map(summary.byCause.map((c) => [c.cause, c]));
  const suggested = SUGGESTED[target.focus ?? ""] ?? [];

  return (
    <>
      {/* The grid stays MOUNTED behind `hidden` rather than being
          unmounted with the tab. Three hundred rows is too much to
          rebuild on every switch, and keeping it alive preserves the
          scroll position and the active filter — which matters, because
          step 5's "Show in grid" lands the reader in it.

          The Data Export preview's grid: one real table, every cell
          ruled, mono at 11px, a sticky heading row and a sticky row
          number. Dense is the point — a department is hundreds of items
          and an airy list shows eight of them. */}
      <div
        hidden={!open}
        className={open ? "flex-1 min-h-0 flex flex-col overflow-hidden" : ""}
      >
        <div
          data-help="causes"
          className="flex-shrink-0 px-4 py-2.5 border-b border-brand_navy/15"
        >
          <CauseChips
            total={items.length}
            only={only}
            onOnly={setOnly}
            allIn={allIn}
            byCause={byCause}
            suggested={suggested}
            fmt={fmt}
          />

          <SupplyWindowNote
            them={target.compareStoreName}
            window={window}
            stage={stage}
          />
        </div>

        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* The grid and the strip under it are one column of the row; the
              rail is the other. Left as siblings of the rail the pager
              became a SECOND column — the grid shrank to its own width and
              the pager floated in the middle of the space beside it. */}
          <div
            data-help="grid"
            className="flex-1 min-w-0 flex flex-col overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
              <table className="border-collapse font-mono text-[11px] w-max">
                <GridHead
                  target={target}
                  filters={filters}
                  byCause={byCause}
                  sort={grid.sort}
                  onSort={grid.handleSort}
                />
                <GridBody
                  rows={capped}
                  selection={selection}
                  allIn={allIn}
                  fmt={fmt}
                />

                {capped.length > 0 && <GridFoot shown={shown} fmt={fmt} />}
              </table>

              {capped.length === 0 && stage !== "sales" && (
                <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
                  Nothing in this department to compare.
                </div>
              )}
            </div>

            {sorted.length > 0 && (
              <GridPager
                sorted={sorted}
                items={items}
                chosen={chosen}
                from={grid.from}
                page={grid.at_}
                pages={grid.pages}
                setPage={grid.setPage}
              />
            )}
          </div>

          <EvidenceRail open={!!pickedItem}>
            {evidence && target && (
              <ItemEvidence
                item={evidence}
                openStoreName={target.storeName}
                openStoreNumber={target.storeNumber}
                compareStoreName={target.compareStoreName}
                compareStoreNumber={target.compareStoreNumber}
                mineOrders={orders.mine}
                theirsOrders={orders.theirs}
                mineReceipts={receipts.mine}
                theirsReceipts={receipts.theirs}
                minePoints={sales?.minePoints ?? []}
                theirsPoints={sales?.theirsPoints ?? []}
                supplyReady={stage === "done"}
                position={{
                  at: Math.max(0, at),
                  of: sorted.length,
                  within: only ? CAUSE_LABEL[only] : null,
                }}
                onStep={grid.stepItem}
                onClose={() => setPicked(null)}
              />
            )}
          </EvidenceRail>
        </div>
      </div>

      {ctx && (
        <GridContextMenu
          ctx={ctx}
          shown={shown}
          chosen={chosen}
          onFind={onOpenSupply}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  );
};

export default ItemsTab;
