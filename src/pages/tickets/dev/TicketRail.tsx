import type { QueueTab } from "../../../features/dev/devTicketsSlice";

interface Props {
  tab: QueueTab;
  counts: {
    all: number;
    unassigned: number;
    mine: number;
    urgent: number;
    closed: number;
  };
  onTab: (tab: QueueTab) => void;
  /** Dev preview toggle and anything else that belongs at the foot rather
   *  than in the queue itself. */
  footer?: React.ReactNode;
}

const QUEUE: { key: QueueTab; label: string }[] = [
  { key: "all", label: "All open" },
  { key: "unassigned", label: "Unassigned" },
  { key: "mine", label: "Mine" },
  { key: "urgent", label: "Urgent" },
  { key: "closed", label: "Closed" },
];

/**
 * Which pile of work you are in.
 *
 * Five folders, exclusive, and that is the whole rail. Status and priority
 * live above the search box instead: they narrow whichever pile is open
 * rather than choosing one, and a rail that mixed the two read as ten folders
 * where picking a second one sometimes replaced the first and sometimes added
 * to it.
 *
 * Every count comes off the queue already in memory — the page fetches
 * without a status filter, so a folder can say how much is in it without a
 * call of its own. Closed carries its own count for the same reason it has
 * its own folder: a queue that filled with a year of finished work would not
 * be a queue.
 */
const TicketRail = ({ tab, counts, onTab, footer }: Props) => (
  <div className="flex h-full w-[168px] flex-none flex-col border-r border-brand_line bg-bkg 2xl:w-[188px]">
    <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
      <div className="px-2.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
        Queue
      </div>
      {QUEUE.map((q) => {
        const active = tab === q.key;
        return (
          <button
            key={q.key}
            type="button"
            onClick={() => onTab(q.key)}
            aria-pressed={active}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[12.5px] transition-colors ${
              active
                ? "bg-brand_navy font-semibold text-custom-white"
                : "text-content/85 hover:bg-custom-white"
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{q.label}</span>
            <span
              className={`flex-none text-[11px] tabular-nums ${
                active ? "text-custom-white/85" : "text-content/85"
              }`}
            >
              {counts[q.key]}
            </span>
          </button>
        );
      })}
    </div>

    {footer && (
      <div className="flex-none border-t border-brand_line p-2">{footer}</div>
    )}
  </div>
);

export default TicketRail;
