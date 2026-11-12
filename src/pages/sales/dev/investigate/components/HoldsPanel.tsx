// Interfaces
import type { Summary } from "../interfaces";
import type {
  Holds,
  Spread,
  Vitals as VitalsShape,
} from "../utils/investigationSteps";

// Components
import HoldsFinding from "./HoldsFinding";
import HoldsCharts from "./HoldsCharts";
import ShortfallList from "./ShortfallList";

interface HoldsPanelProps {
  holds: Holds;
  spread: Spread;
  summary: Summary;
  them: string;
  vitals: VitalsShape;
  cash: (v: number) => string;
  /** Sales and margin can point opposite ways, and nothing else on the
   *  screen would say so. Both come off the sales wave, so this belongs in
   *  the step that draws first. */
  marginGap: number;
  costPenalty: number;
  onPickItem: (code: string) => void;
  onVendor: (vendor: string) => void;
  onSeeAll: () => void;
}

/** The investigation's first tab: whether the report holds, led by the biggest dollar bucket
 *  against the other store, with the charts and the ranked items and vendors behind it. */
const HoldsPanel = ({
  holds,
  spread,
  summary,
  them,
  vitals,
  cash,
  marginGap,
  costPenalty,
  onPickItem,
  onVendor,
  onSeeAll,
}: HoldsPanelProps) => {
  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5">
      <div className="flex flex-col gap-5">
        {/* The finding first, across the width, then the evidence under it:
            the hero on the left and the three supporting cards beside it.
            The carousel sat above all of this for a while, which put three
            charts in front of the sentence they are there to support. */}
        {/* Left: the finding and the three cards that qualify it, one over
            the other. Right: the items it is made of. Side by side the hero
            and the charts crowded each other and the list sat alone under
            both of them. */}
        <div
          className="grid gap-5 items-start"
          style={{ gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1fr)" }}
        >
          <div className="flex flex-col gap-5 min-w-0">
            <HoldsFinding
              holds={holds}
              summary={summary}
              them={them}
              cash={cash}
              marginGap={marginGap}
              costPenalty={costPenalty}
            />

            <HoldsCharts
              spread={spread}
              them={them}
              vitals={vitals}
              cash={cash}
              onVendor={onVendor}
            />
          </div>

          <ShortfallList
            spread={spread}
            cash={cash}
            onPickItem={onPickItem}
            onSeeAll={onSeeAll}
          />
        </div>
      </div>
    </div>
  );
};

export default HoldsPanel;
