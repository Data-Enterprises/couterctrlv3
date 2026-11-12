// Hooks
import { useState } from "react";

// Utils
import { shortStore } from "../utils";
import { supplyRowsOf } from "../utils/supplyRows";

// Interfaces
import type { OrdersWave, ReceiptsWave } from "../utils/investigationData";
import type { Supply } from "../utils/investigationSteps";
import type { SupplyKind } from "../interfaces";

// Components
import SupplyFinding from "./SupplyFinding";
import SupplyCharts from "./SupplyCharts";
import SupplyDocuments from "./SupplyDocuments";

interface SupplyPanelProps {
  supply: Supply;
  them: string;
  us: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** UPCs carried over from the grid, comma or space separated. */
  upcQuery: string;
  onUpcQuery: (v: string) => void;
}

/* ------------------------------------------------------------------ */
/* Supply · the orders and the invoices themselves                     */
/* ------------------------------------------------------------------ */

/**
 * What each store ordered, and what actually turned up.
 *
 * Everywhere else the notebook takes its own word for a cause: an item is
 * labelled never-ordered and the reader is asked to believe there is no
 * order. This is the orders and the invoices, both stores side by side, so
 * the label can be checked rather than trusted.
 */
/**
 * What each store ordered, and what actually turned up.
 *
 * The same shape the Summary tab uses: a verdict card over an evidence
 * carousel on the left, and the list the verdict is about on the right.
 */
const SupplyPanel = ({
  supply,
  them,
  us,
  window,
  cash,
  orders,
  receipts,
  upcQuery,
  onUpcQuery,
}: SupplyPanelProps) => {
  /** The row the documents card shows: this store's orders until another
   *  is picked. */
  const [selected, setSelected] = useState<SupplyKind>("ordersMine");
  const rows = supplyRowsOf(supply);
  const mine = shortStore(us);
  const theirs = shortStore(them);

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5 flex flex-col">
      {/* The page's height, so the documents card fits it and scrolls its
          rows inside. Below that floor the page scrolls as a whole instead. */}
      <div
        className="flex-1 min-h-[560px] grid grid-rows-[minmax(0,1fr)] gap-5"
        style={{ gridTemplateColumns: "minmax(0,0.76fr) minmax(0,1fr)" }}
      >
        {/* Its own scroll, with room for the cards' shadows. */}
        <div className="flex flex-col gap-5 min-w-0 min-h-0 overflow-y-auto thin-scrollbar -m-1 p-1">
          <SupplyFinding
            supply={supply}
            rows={rows}
            us={mine}
            them={theirs}
            window={window}
            ordersOk={orders.ok}
            receiptsOk={receipts.ok}
            selected={selected}
            onSelect={setSelected}
          />

          {/* A supplier they buy from and we do not is a buying decision, not
              an accident — and it is the one thing in here somebody can act
              on without opening a single item. */}
          {supply.onlyTheirs.length > 0 && (
            <div className="rounded-lg bg-severity_watch_bg px-5 py-4">
              <p className="text-[14px] leading-relaxed text-severity_watch_text">
                <span className="font-bold">
                  {supply.onlyTheirs.length === 1
                    ? `One vendor delivers to ${theirs} and not ${mine}`
                    : `${supply.onlyTheirs.length} vendors deliver to ${theirs} and not ${mine}`}
                  :
                </span>{" "}
                {supply.onlyTheirs.join(", ")}.
              </p>
            </div>
          )}

          {/* The rest of the column, so its foot lines up with the documents
              card beside it. */}
          <div className="flex-1 min-h-[180px] flex flex-col">
            <SupplyCharts
              supply={supply}
              them={them}
              us={us}
              window={window}
              cash={cash}
            />
          </div>
        </div>

        <SupplyDocuments
          supply={supply}
          rows={rows}
          us={mine}
          them={theirs}
          window={window}
          cash={cash}
          orders={orders}
          receipts={receipts}
          upcQuery={upcQuery}
          onUpcQuery={onUpcQuery}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
};

export default SupplyPanel;
