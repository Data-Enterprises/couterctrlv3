// Utils
import {
  stampText,
  visibleLabels,
  whenText,
} from "../../../utils/ticketsUtils";
import { storeFullText, storesOf } from "../../../utils";

// Interfaces
import type { Ticket } from "../../../../../../api/tickets";

interface TicketFactsProps {
  ticket: Ticket;
  isTech: boolean;
  canManage: boolean;
}

const TicketFacts = ({ ticket, isTech, canManage }: TicketFactsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-content/85">
      {isTech && ticket.company_name && (
        <span className="font-semibold text-content">
          {ticket.company_name}
        </span>
      )}
      <span>opened by {ticket.opened_by_name}</span>
      <span aria-hidden>·</span>
      <span>{stampText(ticket.created_at)}</span>
      <span aria-hidden>·</span>
      <span>updated {whenText(ticket.updated_at)}</span>
      {ticket.category_name && (
        <>
          <span aria-hidden>·</span>
          <span>{ticket.category_name}</span>
        </>
      )}
      {ticket.stores && (
        <>
          <span aria-hidden>·</span>
          <span className="font-medium text-content">
            {storeFullText(storesOf(ticket))}
          </span>
        </>
      )}
      {/* Who has it, for the readers who have no assign control below —
              a client, and a tech without canManage. */}
      {!canManage && (
        <>
          <span aria-hidden>·</span>
          <span>
            {ticket.assigned_tech
              ? `with ${ticket.assigned_tech}`
              : "unassigned"}
          </span>
        </>
      )}
      {visibleLabels(ticket).map((l) => (
        <span
          key={l.id}
          className="rounded px-1.5 py-[1px] text-[10.5px] font-semibold"
          style={{ background: `${l.color}22`, color: l.color }}
        >
          {l.name}
        </span>
      ))}
    </div>
  );
};

export default TicketFacts;
