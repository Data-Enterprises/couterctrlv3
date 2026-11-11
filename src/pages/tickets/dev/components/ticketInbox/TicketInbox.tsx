// Utils
import { isUnread, snippetOf } from "../../utils/ticketsUtils";
import { SCOPE_TEXT } from "../../utils";

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
import SearchBar from "./components/SearchBar";
import TicketRow from "./components/TicketRow";

interface TicketInboxProps {
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
}: TicketInboxProps) => {
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
        <QueueTabs isTech={isTech} tab={tab} counts={counts} onTab={onTab} />
        <InboxFilters
          filters={filters}
          onFilters={onFilters}
          onClearFilters={onClearFilters}
          statusCounts={statusCounts}
          priorityCounts={priorityCounts}
          storeOptions={storeOptions}
          narrowed={narrowed}
        />
        <SearchBar
          search={search}
          onSearch={onSearch}
          isTech={isTech}
          tab={tab}
          onTab={onTab}
          urgent={counts.urgent}
          onRefresh={onRefresh}
          loading={loading}
          pending={pending}
        />

        {/* Shows the list of tickets based on user level */}
        {scope && scope !== "all" && (
          <p className="m-0 mt-2 text-[11.5px] text-content/95">
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

      <div className="cc-scroll">
        {rows.length === 0 && (
          <p className="px-3 py-6 text-center text-[12.5px] text-content/95">
            {loading ? "Reading the queue…" : "Nothing here."}
          </p>
        )}

        {rows.map((t) => {
          const open = t.id === selectedId;
          const unread = isUnread(t);
          const snippet = snippetOf(t);
          return (
            <TicketRow
              key={t.id}
              ticket={t}
              open={open}
              isTech={isTech}
              userid={userid}
              onSelect={onSelect}
              unread={unread}
              snippet={snippet}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TicketInbox;
