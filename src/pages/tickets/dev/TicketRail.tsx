import type { TicketStatus } from "../../../api/tickets";
import type {
  QueueTab,
  TicketFilters,
} from "../../../features/dev/devTicketsSlice";
import { STATUS_LABEL } from "./ticketsUtils";

interface Props {
  tab: QueueTab;
  counts: { all: number; unassigned: number; mine: number; urgent: number; closed: number };
  filters: TicketFilters;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  onTab: (tab: QueueTab) => void;
  onFilters: (next: Partial<TicketFilters>) => void;
  onClear: () => void;
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

const STATUSES: TicketStatus[] = ["open", "in_progress", "waiting"];

const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

/** One row of the rail. A folder when it sets the queue, a toggle when it
 *  narrows one — same shape either way, because both answer "show me these". */
const Row = ({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[12.5px] transition-colors ${
      active
        ? "bg-brand_navy text-custom-white font-semibold"
        : "text-content/85 hover:bg-custom-white"
    }`}
  >
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && (
      <span
        className={`flex-none text-[11px] tabular-nums ${
          active ? "text-custom-white/85" : "text-content/85"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
    {children}
  </div>
);

/**
 * The queue, as a rail rather than a strip of tabs.
 *
 * Three sections, and they are not the same kind of thing. Queue picks which
 * pile of work you are in and is exclusive — one of five. Status and Priority
 * narrow whichever pile that is, and are multi-select, because "open and
 * waiting" is a real thing to ask for and "open or waiting" is how the column
 * filters already read an untouched heading.
 *
 * Every count is derived from the queue already in memory: the page fetches
 * without a status filter, so a folder can say how much is in it without a
 * call of its own. That is also why Closed carries a count and the status
 * rows below it do not include Closed — it has its own folder, and a queue
 * that filled with a year of finished work would not be a queue.
 */
const TicketRail = ({
  tab,
  counts,
  filters,
  statusCounts,
  priorityCounts,
  onTab,
  onFilters,
  onClear,
  footer,
}: Props) => {
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const narrowed = filters.status.length > 0 || filters.priority.length > 0;

  return (
    <div className="flex h-full w-[168px] flex-none flex-col border-r border-brand_line bg-bkg 2xl:w-[188px]">
      <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar px-2 pb-2">
        <Caption>Queue</Caption>
        {QUEUE.map((q) => (
          <Row
            key={q.key}
            label={q.label}
            count={counts[q.key]}
            active={tab === q.key}
            onClick={() => onTab(q.key)}
          />
        ))}

        <Caption>Status</Caption>
        {STATUSES.map((s) => (
          <Row
            key={s}
            label={STATUS_LABEL[s]}
            count={statusCounts[s] ?? 0}
            active={filters.status.includes(s)}
            onClick={() => onFilters({ status: toggle(filters.status, s) })}
          />
        ))}

        <Caption>Priority</Caption>
        {PRIORITIES.map((p) => (
          <Row
            key={p.value}
            label={p.label}
            count={priorityCounts[p.value] ?? 0}
            active={filters.priority.includes(p.value)}
            onClick={() =>
              onFilters({ priority: toggle(filters.priority, p.value) })
            }
          />
        ))}

        {narrowed && (
          <button
            type="button"
            onClick={onClear}
            className="mt-2 w-full rounded-md px-2.5 py-[7px] text-left text-[12px] font-semibold text-brand_navy_hover hover:bg-custom-white"
          >
            Clear narrowing
          </button>
        )}
      </div>

      {footer && (
        <div className="flex-none border-t border-brand_line p-2">{footer}</div>
      )}
    </div>
  );
};

export default TicketRail;
