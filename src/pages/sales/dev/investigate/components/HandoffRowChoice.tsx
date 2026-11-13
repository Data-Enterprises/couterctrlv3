// Utils
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { HANDOFF_NAME, handoffKey } from "../utils/handoff";

// Interfaces
import type { HandoffList } from "../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface HandoffRowChoiceProps {
  list: HandoffList;
  fmt: (v: number) => string;
  on: boolean;
  onPick: () => void;
}

/** One person's row on the Hand-off tab: who, the causes on their list, how
 *  many items and what they come to. Picking it slides the list card to it. */
const HandoffRowChoice = ({ list, fmt, on, onPick }: HandoffRowChoiceProps) => {
  const nobody = list.owner === null;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`grid grid-cols-[10px_minmax(0,1fr)_80px_104px_14px] gap-2.5 items-center w-full px-2 py-2 rounded-md border text-left transition-colors ${
        on ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${nobody ? "bg-ungraded" : "bg-brand_navy"}`} />
      <span className="flex flex-col min-w-0">
        <span className={`text-[13px] text-content ${on ? "font-bold" : "font-semibold"}`}>
          {HANDOFF_NAME[handoffKey(list.owner)]}
        </span>
        <span className="text-[12px] text-brand_slate truncate">
          {list.desks.map((d) => CAUSE_LABEL[d.cause]).join(" | ")}
        </span>
      </span>
      <span className="text-right text-[12.5px] text-content/95 tabular-nums whitespace-nowrap">
        {list.items.length.toLocaleString("en-US")} items
      </span>
      <span
        className={`text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
          nobody ? "text-content" : "text-delta_negative_text"
        }`}
      >
        {list.total < 0 ? "−" : ""}
        {fmt(Math.abs(list.total))}
      </span>
      <ChevronRightIcon
        className={`w-3.5 h-3.5 ${on ? "text-brand_navy" : "text-brand_slate_2"}`}
      />
    </button>
  );
};

export default HandoffRowChoice;
