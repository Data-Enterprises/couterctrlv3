// Hooks
import { useState } from "react";

// Utils
import { HANDOFF_TAB, handoffKey, handoffOf } from "../utils/handoff";

// Interfaces
import type { Cause, HandoffList, HandoffOwner } from "../interfaces";
import type { Desk } from "../utils/investigationSteps";

// Components
import Carousel from "./Carousel";
import HandoffFinding from "./HandoffFinding";
import HandoffSlide from "./HandoffSlide";

interface ActPanelProps {
  desks: Desk[];
  /** The two stores' numbers. */
  us: string;
  them: string;
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
  onShow: (c: Cause) => void;
  /** Download one person's list as a file. */
  onExport: (list: HandoffList) => void;
  onPickItem: (code: string) => void;
}

/* ------------------------------------------------------------------ */
/* Step 5 · who fixes it                                               */
/* ------------------------------------------------------------------ */

/** The investigation's "who fixes it" tab: one list per person rather than one
 *  card per cause. The left card says how much has an owner and picks a
 *  person; the right card is that person's whole list, with its actions. */
const ActPanel = ({ desks, us, them, fmt, onShow, onExport, onPickItem }: ActPanelProps) => {
  const lists = handoffOf(desks);
  const owners = lists.map((l) => l.owner);
  /** The list on show: the first person's until another is picked. */
  const [picked, setPicked] = useState<HandoffOwner | undefined>(undefined);
  const selected = picked !== undefined && owners.includes(picked) ? picked : (owners[0] ?? null);

  if (lists.length === 0)
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center text-[13px] text-content/95">
        Nothing to hand to anyone: no item is behind.
      </div>
    );

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar bg-custom-white px-4 py-5 flex flex-col">
      {/* The page's height, so the list card fits it and scrolls inside.
          Below that floor the page scrolls as a whole instead. */}
      <div
        className="flex-1 min-h-[560px] grid grid-rows-[minmax(0,1fr)] gap-5"
        style={{ gridTemplateColumns: "minmax(0,0.76fr) minmax(0,1fr)" }}
      >
        <div className="min-w-0 min-h-0 overflow-y-auto thin-scrollbar -m-1 p-1">
          <HandoffFinding lists={lists} fmt={fmt} selected={selected} onSelect={setPicked} />
        </div>

        <Carousel
          fill
          helpAnchor="handoff-list"
          at={owners.indexOf(selected)}
          onAt={(i) => setPicked(owners[i])}
          slides={lists.map((l) => ({
            label: HANDOFF_TAB[handoffKey(l.owner)],
            count: l.items.length,
            body: (
              <HandoffSlide
                list={l}
                us={us}
                them={them}
                fmt={fmt}
                onShow={onShow}
                onExport={() => onExport(l)}
                onPickItem={onPickItem}
              />
            ),
          }))}
        />
      </div>
    </div>
  );
};

export default ActPanel;
