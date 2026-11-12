// Utils
import { handoffKey, handoffLead } from "../utils/handoff";

// Interfaces
import type { HandoffList, HandoffOwner } from "../interfaces";

// Components
import HandoffRowChoice from "./HandoffRowChoice";

interface HandoffFindingProps {
  lists: HandoffList[];
  fmt: (v: number) => string;
  selected: HandoffOwner;
  onSelect: (owner: HandoffOwner) => void;
}

/** The Hand-off tab's first card: how much of the shortfall has someone to
 *  hand it to, and one row per person that picks the list card. */
const HandoffFinding = ({ lists, fmt, selected, onSelect }: HandoffFindingProps) => {
  const lead = handoffLead(lists);
  const signed = (v: number) => `${v < 0 ? "−" : ""}${fmt(Math.abs(v))}`;
  const whole = Math.abs(lead.total) || 1;
  return (
    <div className="rounded-lg bg-custom-white shadow-card px-5 py-4 min-w-0 flex flex-col gap-3.5">
      <div className="rounded-md bg-bkg px-3.5 py-3 flex flex-col gap-2.5">
        <p className="text-[17px] font-semibold leading-snug text-content">{lead.says}</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[30px] font-bold tabular-nums leading-none text-delta_negative_text">
            {signed(lead.ownedTotal)}
          </span>
          <span className="text-[13.5px] text-content/95 min-w-0">
            of the <span className="font-semibold text-content">{signed(lead.total)}</span>{" "}
            shortfall has an owner |{" "}
            <span className="font-semibold text-content">{signed(lead.rest)}</span> doesn&rsquo;t
          </span>
        </div>
      </div>

      <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-bkg">
        <span
          className="block bg-red-500"
          style={{ width: `${(Math.abs(lead.ownedTotal) / whole) * 100}%` }}
        />
        <span
          className="block bg-ungraded"
          style={{ width: `${(Math.abs(lead.rest) / whole) * 100}%` }}
        />
      </span>

      <div className="flex flex-col gap-0.5">
        {lists.map((l) => (
          <HandoffRowChoice
            key={handoffKey(l.owner)}
            list={l}
            fmt={fmt}
            on={l.owner === selected}
            onPick={() => onSelect(l.owner)}
          />
        ))}
      </div>
    </div>
  );
};

export default HandoffFinding;
