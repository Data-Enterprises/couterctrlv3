import type { Ticket } from "../../../api/tickets";
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  whenText,
} from "./ticketsUtils";

interface Props {
  rows: Ticket[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Company, opener and assignee are a tech's columns. A client reading
   *  "assigned to Alex" invites a question the page cannot answer. */
  isTech: boolean;
  loading: boolean;
}

/**
 * The list, for both views.
 *
 * One component rather than two, because the rows ARE the same rows — the
 * difference is three columns and who the endpoint sent. Forking it would
 * mean two places to fix the next time a column changes.
 */
const TicketList = ({ rows, selectedId, onSelect, isTech, loading }: Props) => {
  const cols = isTech
    ? "110px 84px minmax(0, 1fr) 140px 140px 88px 130px 84px"
    : "110px 84px minmax(0, 1fr) 88px 110px";

  return (
    <div className="flex-1 min-h-0 bg-card_bg border border-brand_line rounded-xl flex flex-col overflow-hidden">
      <div
        className="grid gap-3 px-4 py-2.5 bg-custom-white border-b border-brand_line text-[10.5px] font-semibold uppercase tracking-wide text-content/85 flex-shrink-0"
        style={{ gridTemplateColumns: cols }}
      >
        <span>Status</span>
        <span>Ticket</span>
        <span>Title</span>
        {isTech && <span>Company</span>}
        {isTech && <span>Opened by</span>}
        <span>Priority</span>
        {isTech && <span>Assignee</span>}
        <span>Updated</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {rows.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => onSelect(ticket.id)}
            className={`w-full grid gap-3 px-4 py-3 text-left items-center border-b border-brand_line text-[13px] transition-colors ${
              ticket.id === selectedId
                ? "bg-row_selected border-l-2 border-l-brand_navy_hover"
                : "hover:bg-custom-white border-l-2 border-l-transparent"
            }`}
            style={{ gridTemplateColumns: cols }}
          >
            <span>
              <span
                className={`inline-block text-[11.5px] font-semibold rounded px-2 py-0.5 ${STATUS_CLASS[ticket.status]}`}
              >
                {STATUS_LABEL[ticket.status]}
              </span>
            </span>
            <span className="font-mono text-[12px] text-content/85">
              {ticket.ticket_number}
            </span>
            <span className="font-semibold truncate">{ticket.title}</span>
            {isTech && (
              <span className="text-content/85 truncate">
                {ticket.company_name ?? "—"}
              </span>
            )}
            {isTech && (
              <span className="text-content/85 truncate">
                {ticket.opened_by_name}
              </span>
            )}
            <span>
              <span
                className={`inline-block text-[11.5px] font-semibold rounded px-2 py-0.5 ${
                  PRIORITY_CLASS[ticket.priority] ?? PRIORITY_CLASS.normal
                }`}
              >
                {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
              </span>
            </span>
            {isTech && (
              <span
                className={
                  ticket.assignee_id === null
                    ? "text-brand_danger font-semibold"
                    : "text-content/85 truncate"
                }
              >
                {ticket.assigned_tech ?? "Unassigned"}
              </span>
            )}
            <span className="text-content/85">{whenText(ticket.updated_at)}</span>
          </button>
        ))}

        {rows.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-[13px] font-semibold">
              {loading ? "Reading the queue..." : "Nothing here"}
            </div>
            <div className="text-[12.5px] text-content/85 mt-1.5 max-w-[46ch] mx-auto">
              {loading
                ? "One call for the tickets, one for the pickers."
                : "No ticket matches this tab and search. Closed ones have their own tab."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
