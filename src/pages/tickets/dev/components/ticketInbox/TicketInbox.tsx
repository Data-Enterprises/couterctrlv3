// Utils
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  initialsOf,
  isUnread,
  snippetOf,
  visibleLabels,
  whenText,
} from "../../utils/ticketsUtils";
import { SCOPE_TEXT, storeChipText, storesOf } from "../../utils";

// Interfaces
import type {
  Ticket,
  TicketScope,
  TicketStore,
} from "../../../../../api/tickets";
import type {
  QueueTab,
  TicketFilters,
} from "../../../../../features/dev/devTicketsSlice";

// Components
import InboxHeader from "./components/InboxHeader";
import QueueTabs from "./components/QueueTabs";
import InboxFilters from "./components/InboxFilters";

interface Props {
  rows: Ticket[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isTech: boolean;
  scope: TicketScope | null;
  userid: number;
  storeOptions: TicketStore[];
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
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  pending: boolean;
  onRefresh: () => void;
  onNew?: () => void;
  onTechs?: () => void;
  error: string | null;
}

/**
 * The queue as a column of conversations. The two pickers above the search
 * narrow whichever tab is open. The unread dot and reply preview draw nothing
 * until the list endpoint sends them (see `snippetOf`, `isUnread`).
 */
const TicketInbox = ({
  rows,
  selectedId,
  onSelect,
  isTech,
  scope,
  userid,
  storeOptions,
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
  onTechs,
  error,
}: Props) => {
  const narrowed =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.stores.length > 0;

  return (
    <div className="flex h-full w-[379px] flex-none flex-col overflow-hidden rounded-xl bg-custom-white shadow-lg xl:w-[410px] 2xl:w-[460px]">
      {/* InboxHeader.tsx: One row: Urgent and Refresh sit beside the search box they act on. */}
      <InboxHeader
        isTech={isTech}
        scope={scope}
        onTechs={onTechs}
        rows={rows}
      />

      <div className="flex-none border-b border-brand_line p-2.5">
        {/* Tabs, because they are exclusive and the top level of this column. */}
        {/* QueueTabs.tsx: `auto-cols-fr`, so a client's two tabs share the width evenly. */}
        <QueueTabs isTech={isTech} tab={tab} counts={counts} onTab={onTab} />

        {/* InboxFilters.tsx: status and priority filters, plus clear button if narrowed. */}
        <InboxFilters
          filters={filters}
          onFilters={onFilters}
          onClearFilters={onClearFilters}
          statusCounts={statusCounts}
          priorityCounts={priorityCounts}
          storeOptions={storeOptions}
          narrowed={narrowed}
        />
        {/* SearchBar.tsx */}
        <div className="mt-2 flex items-center gap-1.5">
          <label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </label>
          <input
            data-help="search"
            id="ticket-search"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={isTech ? "Search the queue" : "Search your tickets"}
            className="min-w-0 flex-1 rounded-lg border border-brand_line bg-bkg px-3 py-2 text-[12.5px]"
          />
          {/* Tinted only while there is something to see: a zero in severity
              red is a false alarm every time the queue is clean. */}
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
              Urgent <span className="tabular-nums">{counts.urgent}</span>
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

        {/* What this list is, from the server's `scope`, so a manager knows
            why a coworker's ticket is not here. */}
        {scope && scope !== "all" && (
          <p className="m-0 mt-2 text-[11.5px] text-content/85">
            {SCOPE_TEXT[scope]}
          </p>
        )}

        {onNew && (
          <button
            data-help="new-ticket"
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
        {/* TicketRow.tsx: the rows.map return will be its own component */}
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
                {/* The number rides the title: it is how a ticket is named out loud. */}
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

                {/* Who to answer: a client's own rows name the tech; a manager's
                    staff tickets name who filed them. */}
                <span className="mt-0.5 block truncate text-[11.5px] text-content/85">
                  {isTech || t.opened_by !== userid
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
                  {storesOf(t).length > 0 && (
                    <span
                      title={storesOf(t)
                        .map((st) => `#${st.store_number} ${st.store_name}`)
                        .join(", ")}
                      className="rounded bg-bkg px-1.5 py-[1px] font-mono text-[10px] text-content/85"
                    >
                      {storeChipText(storesOf(t))}
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
