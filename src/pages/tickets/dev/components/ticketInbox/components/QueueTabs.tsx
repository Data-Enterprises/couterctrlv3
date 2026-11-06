import { CLIENT_QUEUE, QUEUE } from "../utils";
import type { QueueTab } from "../../../../../../features/dev/devTicketsSlice";

interface QueueTabsProps {
  isTech: boolean;
  tab: QueueTab;
  counts: {
    all: number;
    unassigned: number;
    mine: number;
    urgent: number;
    closed: number;
  };
  onTab: (tab: QueueTab) => void;
}

const QueueTabs = ({ isTech, tab, counts, onTab }: QueueTabsProps) => {
  return (
    <div
      data-help="queue-tabs"
      role="tablist"
      className="-mx-2.5 -mt-2.5 mb-2.5 grid auto-cols-fr grid-flow-col border-b border-brand_line px-2.5"
    >
      {(isTech ? QUEUE : CLIENT_QUEUE).map((q) => {
        const active = tab === q.key;
        return (
          <button
            key={q.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTab(q.key)}
            className={`min-w-0 truncate border-b-2 px-1 pb-2 pt-2.5 text-center text-[12.5px] transition-colors ${
              active
                ? "border-brand_navy font-semibold text-content"
                : "border-transparent text-content/85 hover:border-brand_line_2"
            }`}
          >
            {q.label}{" "}
            <span className="tabular-nums text-content/85">
              {counts[q.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default QueueTabs;
