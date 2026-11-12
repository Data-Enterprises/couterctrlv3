// Hooks
import { useState } from "react";

// Utils
import { shortStore } from "../utils";
import { leadRow } from "../utils/holdsRows";

// Interfaces
import type { HoldsRow, RowKind, Summary } from "../interfaces";
import type {
  Holds,
  Spread,
  Vitals as VitalsShape,
} from "../utils/investigationSteps";

// Components
import UpcContextMenu from "../../../../../components-dev/UpcContextMenu";
import HoldsFinding from "./HoldsFinding";
import HoldsCharts from "./HoldsCharts";
import RowItems from "./RowItems";

interface HoldsPanelProps {
  holds: Holds;
  rows: HoldsRow[];
  spread: Spread;
  summary: Summary;
  us: string;
  them: string;
  vitals: VitalsShape;
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  onPickItem: (code: string) => void;
  onVendor: (vendor: string) => void;
  onSeeAll: () => void;
  /** Narrow the Supply tab to this code and go there. */
  onFindInSupply: (upc: string) => void;
}

/** The investigation's first tab: whether the report holds, led by the biggest row against
 *  the other store, with the charts and the picked row's items behind it. */
const HoldsPanel = ({
  holds,
  rows,
  spread,
  summary,
  us,
  them,
  vitals,
  fmt,
  cash,
  marginGap,
  costPenalty,
  onPickItem,
  onVendor,
  onSeeAll,
  onFindInSupply,
}: HoldsPanelProps) => {
  /** The row the items card shows. Until one is picked, the row with the
   *  most money in it, which is the one the finding leads with. */
  const [picked, setPicked] = useState<RowKind | null>(null);
  const selected = picked ?? leadRow(rows);
  const mine = shortStore(us);
  const theirs = shortStore(them);
  /** The items card's right-click menu, while it is open. */
  const [menu, setMenu] = useState<{ x: number; y: number; upc: string } | null>(null);
  const slideUpcs =
    rows.find((r) => r.kind === selected)?.items.map((i) => i.productCode) ?? [];

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5 flex flex-col">
      {/* The page's height, so the items card fits it and scrolls its rows
          inside. Below that floor the page scrolls as a whole instead. */}
      <div className="flex-1 min-h-[560px] flex flex-col gap-5">
        {/* The finding first, across the width, then the evidence under it:
            the hero on the left and the three supporting cards beside it.
            The carousel sat above all of this for a while, which put three
            charts in front of the sentence they are there to support. */}
        {/* Left: the finding and the three cards that qualify it, one over
            the other. Right: the items it is made of. Side by side the hero
            and the charts crowded each other and the list sat alone under
            both of them. */}
        <div
          className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)] gap-5"
          style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1fr)" }}
        >
          {/* Its own scroll, with room for the cards' shadows. */}
          <div className="flex flex-col gap-5 min-w-0 min-h-0 overflow-y-auto thin-scrollbar -m-1 p-1">
            <HoldsFinding
              holds={holds}
              rows={rows}
              summary={summary}
              us={mine}
              them={theirs}
              fmt={fmt}
              cash={cash}
              marginGap={marginGap}
              costPenalty={costPenalty}
              selected={selected}
              onSelect={setPicked}
            />

            {/* The rest of the column, so its foot lines up with the items
                card beside it. */}
            <div className="flex-1 min-h-[240px] flex flex-col">
              <HoldsCharts
                spread={spread}
                them={them}
                vitals={vitals}
                fmt={fmt}
                cash={cash}
                onVendor={onVendor}
              />
            </div>
          </div>

          <RowItems
            rows={rows}
            us={mine}
            them={theirs}
            fmt={fmt}
            cash={cash}
            selected={selected}
            onSelect={setPicked}
            onPickItem={onPickItem}
            onSeeAll={onSeeAll}
            onItemMenu={(x, y, upc) => setMenu({ x, y, upc })}
          />
        </div>
      </div>

      {menu && (
        <UpcContextMenu
          x={menu.x}
          y={menu.y}
          upc={menu.upc}
          allUpcs={slideUpcs}
          extraActions={[
            { label: "View in Supply", onClick: () => onFindInSupply(menu.upc) },
          ]}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
};

export default HoldsPanel;
