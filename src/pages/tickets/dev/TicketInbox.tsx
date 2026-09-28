import MultiSelectFilter from "../../../components-dev/filters/MultiSelectFilter";
import type { Ticket, TicketStatus } from "../../../api/tickets";
import type {
  QueueTab,
  TicketFilters,
} from "../../../features/dev/devTicketsSlice";
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  initialsOf,
  isUnread,
  snippetOf,
  visibleLabels,
  whenText,
} from "./ticketsUtils";

interface Props {
  rows: Ticket[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Company and opener are a tech's to read. A client seeing "Bruces
   *  Foodland" on their own ticket learns nothing. */
  isTech: boolean;
  loading: boolean;
  tab: QueueTab;
  counts: {
    all: number;
    unassigned: number;
    mine: number;
    urgent: number;
    closed: number;
  };
  onTab: (tab: QueueTab) => void;
  search: string;
  onSearch: (value: string) => void;
  filters: TicketFilters;
  onFilters: (next: Partial<TicketFilters>) => void;
  onClearFilters: () => void;
  /** Counts ride the option labels, so the picker says how much is behind
   *  each one before it is opened. */
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  /** The queue has moved under us — the button says so rather than a bar. */
  pending: boolean;
  onRefresh: () => void;
  /** Filing is the client's action; a tech has no button (see Tickets.tsx). */
  onNew?: () => void;
  error: string | null;
}

/** Closed has its own folder in the rail, so it is not one of the statuses
 *  you narrow an open pile by. */
const STATUSES: TicketStatus[] = ["open", "in_progress", "waiting"];

/**
 * The tabs, which are the piles you work through in order.
 *
 * Urgent is not one of them — it is a jump to whatever cannot wait, so it
 * sits beside Refresh as a button that says how many, rather than as a fourth
 * tab you would have to remember to look at. A client has two tabs and no
 * urgent button: Unassigned, Mine and Urgent are all the same pile when every
 * ticket is yours.
 */
const QUEUE: { key: QueueTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "mine", label: "Mine" },
  { key: "closed", label: "Closed" },
];

const CLIENT_QUEUE: { key: QueueTab; label: string }[] = [
  { key: "all", label: "Open" },
  { key: "closed", label: "Closed" },
];

const PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

/**
 * The queue as a column of conversations.
 *
 * This replaced a six-to-eight column grid. The grid could say more per row,
 * but only at a width that left the thread beside it too narrow to read, and
 * the columns it spent that width on — company, opener, assignee — are three
 * of the six fields the search box already matches on. So the row keeps what
 * identifies a ticket and the rail keeps what sorts it.
 *
 * The two narrowing pickers sit above the search box rather than in the rail.
 * They are not folders: they cut down whichever folder is open, and both are
 * multi-select, so mixing them into an exclusive list of five made picking a
 * second one mean two different things depending on where it was.
 *
 * Two things are drawn but not yet fed, and deliberately: the unread dot and
 * the reply preview. `snippetOf` and `isUnread` are the only place that knows
 * the fields are missing, and both render to nothing until the list endpoint
 * carries them — the row's shape does not change when they arrive.
 */
const TicketInbox = ({
  rows,
  selectedId,
  onSelect,
  isTech,
  loading,
  tab,
  counts,
  onTab,
  search,
  onSearch,
  filters,
  onFilters,
  onClearFilters,
  statusCounts,
  priorityCounts,
  pending,
  onRefresh,
  onNew,
  error,
}: Props) => {
  const narrowed = filters.status.length > 0 || filters.priority.length > 0;

  return (
    <div className="flex h-full w-[379px] flex-none flex-col border-r border-brand_line bg-custom-white xl:w-[410px] 2xl:w-[460px]">
      <div className="flex-none border-b border-brand_line p-2.5">
        {/* Tabs, because they are exclusive and they are the top level of
            this column — a row of pills read as four more filters beside the
            two that actually are. */}
        {/* `auto-cols-fr` rather than a fixed four, so the client's two
            divide the same width evenly instead of leaving half the row
            empty. */}
        <div
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

        <div className="flex items-center gap-1.5">
          <MultiSelectFilter
            options={STATUSES.map((s) => ({
              value: s,
              label: `${STATUS_LABEL[s]} (${statusCounts[s] ?? 0})`,
            }))}
            values={filters.status}
            onChange={(values) => onFilters({ status: values })}
            placeholder="Any status"
            noun="statuses"
            className="flex-1"
          />
          <MultiSelectFilter
            options={PRIORITIES.map((p) => ({
              value: p.value,
              label: `${p.label} (${priorityCounts[p.value] ?? 0})`,
            }))}
            values={filters.priority}
            onChange={(values) => onFilters({ priority: values })}
            placeholder="Any priority"
            noun="priorities"
            className="flex-1"
          />
          {narrowed && (
            <button
              type="button"
              onClick={onClearFilters}
              aria-label="Clear narrowing"
              title="Clear narrowing"
              className="flex-none rounded px-1.5 py-0.5 text-[12px] font-semibold text-brand_navy_hover hover:bg-bkg"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </label>
          <input
            id="ticket-search"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={isTech ? "Search the queue" : "Search your tickets"}
            className="min-w-0 flex-1 rounded-lg border border-brand_line bg-bkg px-3 py-2 text-[12.5px]"
          />
          {/* Beside Refresh because both are "what has changed" — one asks,
              the other already knows. Tinted only while there is something
              to see: a zero in severity red is a false alarm every time the
              queue is clean. */}
          {isTech && (
            <button
              type="button"
              onClick={() => onTab("urgent")}
              aria-pressed={tab === "urgent"}
              title="Tickets that cannot wait"
              className={`flex-none rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition-colors ${
                tab === "urgent"
                  ? "border-severity_critical_text bg-severity_critical_text text-custom-white"
                  : counts.urgent > 0
                    ? "border-severity_critical_text/25 bg-severity_critical_bg text-severity_critical_text"
                    : "border-brand_line_2 text-content/85 hover:border-brand_slate"
              }`}
            >
              Urgent{" "}
              <span className="tabular-nums">{counts.urgent}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title={
              pending
                ? "The queue has moved since this list was read"
                : "Refresh"
            }
            aria-label="Refresh"
            className={`flex-none rounded-lg border px-2.5 py-2 text-[12px] transition-colors disabled:opacity-40 ${
              pending
                ? "border-filter_active_border bg-filter_active font-semibold text-brand_navy_hover"
                : "border-brand_line_2 hover:border-brand_slate"
            }`}
          >
            {loading ? "…" : pending ? "New" : "↻"}
          </button>
        </div>

        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="mt-2 w-full rounded-lg bg-brand_navy px-4 py-2 text-[12.5px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover"
          >
            New ticket
          </button>
        )}

        {error && (
          <div className="mt-2 rounded-lg border border-severity_watch_text/25 bg-severity_watch_bg px-2.5 py-1.5 text-[12px] text-severity_watch_text">
            {error}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">
        {rows.length === 0 && (
          <p className="px-3 py-6 text-center text-[12.5px] text-content/85">
            {loading ? "Reading the queue…" : "Nothing here."}
          </p>
        )}

        {rows.map((t) => {
          const open = t.id === selectedId;
          const unread = isUnread(t);
          const snippet = snippetOf(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-current={open}
              className={`flex w-full gap-2.5 border-b border-brand_line px-2.5 py-2.5 text-left transition-colors ${
                open ? "bg-row_selected" : "hover:bg-bkg"
              }`}
            >
              {/* The dot's column is held whether or not there is a dot, so a
                  row does not shift sideways the day unread starts working. */}
              <span
                aria-hidden
                className={`mt-[7px] h-[7px] w-[7px] flex-none rounded-full ${
                  unread ? "bg-brand_navy" : "bg-transparent"
                }`}
              />

              <span className="mt-[1px] flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand_slate text-[10px] font-bold text-custom-white">
                {initialsOf(t.opened_by_name)}
              </span>

              <span className="min-w-0 flex-1">
                {/* The number rides the title rather than taking a line of its
                    own: it is how a ticket is referred to out loud, and on its
                    own line it pushed everything that says what the ticket IS
                    further down. */}
                <span className="flex items-baseline gap-2">
                  <span
                    className={`min-w-0 flex-1 truncate text-[12.5px] ${
                      unread ? "font-bold" : "font-semibold"
                    }`}
                  >
                    <span className="font-mono text-[11px] text-content/85">
                      {t.ticket_number}
                    </span>{" "}
                    {t.title}
                  </span>
                  <span className="flex-none text-[11px] text-content/85">
                    {whenText(t.updated_at)}
                  </span>
                </span>

                {/* Who to answer. A client already knows who they are, so
                    their rows name the tech instead. */}
                <span className="mt-0.5 block truncate text-[11.5px] text-content/85">
                  {isTech
                    ? t.opened_by_name
                    : (t.assigned_tech ?? "Unassigned")}
                </span>

                {snippet && (
                  <span className="mt-0.5 block truncate text-[11.5px] text-content/85">
                    {snippet}
                  </span>
                )}

                <span className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span
                    className={`rounded px-1.5 py-[1px] text-[10px] font-semibold ${STATUS_CLASS[t.status]}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>
                  {t.priority !== "normal" && (
                    <span
                      className={`rounded px-1.5 py-[1px] text-[10px] font-semibold ${PRIORITY_CLASS[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                  )}
                  {isTech && t.company_name && (
                    <span className="max-w-[120px] truncate rounded bg-bkg px-1.5 py-[1px] text-[10px] text-content/85">
                      {t.company_name}
                    </span>
                  )}
                  {visibleLabels(t).map((l) => (
                    <span
                      key={l.id}
                      className="max-w-[110px] truncate rounded px-1.5 py-[1px] text-[10px] font-semibold"
                      style={{ background: `${l.color}22`, color: l.color }}
                    >
                      {l.name}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TicketInbox;
