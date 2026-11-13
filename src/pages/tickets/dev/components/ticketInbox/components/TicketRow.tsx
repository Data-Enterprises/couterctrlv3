// Utils
import { storeChipText, storesOf } from "../../../utils";
import {
  initialsOf,
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
  visibleLabels,
  whenText,
} from "../../../utils/ticketsUtils";

// Interfaces
import type { Ticket } from "../../../../../../api/tickets";

interface TicketRowProps {
  ticket: Ticket;
  open: boolean;
  isTech: boolean;
  userid: number;
  onSelect: (id: number) => void;
  unread: boolean;
  snippet: string | null;
}

/** One ticket in the list: unread dot, opener's initials, number and title, last update, who to answer, a snippet, and status, priority, store, company and label chips. */
const TicketRow = ({
  ticket,
  open,
  isTech,
  userid,
  onSelect,
  unread,
  snippet,
}: TicketRowProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.id)}
      aria-current={open}
      className={`flex w-full gap-2.5 border-b border-brand_line px-2.5 py-2.5 text-left transition-colors ${
        open ? "bg-row_selected" : "hover:bg-bkg"
      }`}
    >
      {/* The dot's column is held whether or not there is a dot, so a row does not shift sideways the day unread starts working. */}
      <span
        aria-hidden
        className={`mt-[7px] h-[7px] w-[7px] flex-none rounded-full ${
          unread ? "bg-brand_navy" : "bg-transparent"
        }`}
      />

      <span className="mt-[1px] flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand_slate text-[10px] font-bold text-custom-white">
        {initialsOf(ticket.opened_by_name)}
      </span>

      <span className="min-w-0 flex-1">
        {/* The number rides the title: it is how a ticket is named out loud. */}
        <span className="flex items-baseline gap-2">
          <span
            className={`min-w-0 flex-1 truncate text-[12.5px] ${
              unread ? "font-bold" : "font-semibold"
            }`}
          >
            <span className="font-mono text-[11px] text-content/95">
              {ticket.ticket_number}
            </span>{" "}
            {ticket.title}
          </span>
          <span className="flex-none text-[11px] text-content/95">
            {whenText(ticket.updated_at)}
          </span>
        </span>

        {/* Who to answer: a client's own rows name the tech; a manager's staff tickets name who filed them. */}
        <span className="mt-0.5 block truncate text-[11.5px] text-content/95">
          {isTech || ticket.opened_by !== userid
            ? ticket.opened_by_name
            : (ticket.assigned_tech ?? "Unassigned")}
        </span>

        {snippet && (
          <span className="mt-0.5 block truncate text-[11.5px] text-content/95">
            {snippet}
          </span>
        )}

        <span className="mt-1.5 flex flex-wrap items-center gap-1">
          <span
            className={`rounded px-1.5 py-[1px] text-[10px] font-semibold ${STATUS_CLASS[ticket.status]}`}
          >
            {STATUS_LABEL[ticket.status]}
          </span>
          {ticket.priority !== "normal" && (
            <span
              className={`rounded px-1.5 py-[1px] text-[10px] font-semibold ${PRIORITY_CLASS[ticket.priority]}`}
            >
              {ticket.priority}
            </span>
          )}
          {storesOf(ticket).length > 0 && (
            <span
              title={storesOf(ticket)
                .map((st) => `#${st.store_number} ${st.store_name}`)
                .join(", ")}
              className="rounded bg-bkg px-1.5 py-[1px] font-mono text-[10px] text-content/95"
            >
              {storeChipText(storesOf(ticket))}
            </span>
          )}
          {isTech && ticket.company_name && (
            <span className="max-w-[120px] truncate rounded bg-bkg px-1.5 py-[1px] text-[10px] text-content/95">
              {ticket.company_name}
            </span>
          )}
          {visibleLabels(ticket).map((l) => (
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
};

export default TicketRow;
