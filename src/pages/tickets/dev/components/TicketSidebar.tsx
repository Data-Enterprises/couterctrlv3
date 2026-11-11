// Utils
import {
  alsoFrom,
  initialsOf,
  openerStats,
  STATUS_CLASS,
  STATUS_LABEL,
  whenText,
} from "../utils/ticketsUtils";

// Interfaces
import type { Ticket } from "../../../../api/tickets";

// Components
import Caption from "./Caption";
import Fact from "./Fact";

interface TicketSidebarProps {
  ticket: Ticket;
  tickets: Ticket[];
  onSelect: (id: number) => void;
}

/**
 * Who filed this, and what else they have filed. The ticket's own facts sit
 * under the thread's header.
 */
const TicketSidebar = ({ ticket, tickets, onSelect }: TicketSidebarProps) => {
  const stats = openerStats(tickets, ticket);
  const others = alsoFrom(tickets, ticket);

  return (
    <div className="cc-panel h-full w-[248px] flex-none shadow-lg 2xl:w-[288px]">
      <div className="flex-shrink-0 rounded-t-xl bg-brand_navy px-4 pt-1 pb-2.5">
        <div className="flex min-h-[24px] items-end gap-3">
          <span className="flex-shrink-0 text-[13px] cc-navy-title">
            Who sent it
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-custom-white/15 text-[10px] font-bold text-custom-white">
            {initialsOf(ticket.opened_by_name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] cc-navy-title">
              {ticket.opened_by_name}
            </span>
            <span className="block truncate font-mono text-[10px] text-custom-white/95">
              {ticket.opened_by_username}
            </span>
          </span>
        </div>
      </div>

      <div className="cc-scroll">
        {ticket.company_name && (
          <div className="mt-3 px-3.5">
            <div className="rounded-lg bg-bkg px-2.5 py-2">
              <div className="cc-caps-mono text-[9.5px]">
                Company
              </div>
              <div className="mt-0.5 truncate text-[12.5px] font-semibold">
                {ticket.company_name}
              </div>
            </div>
          </div>
        )}

        <Caption>Their history</Caption>
        <Fact label="Tickets filed" value={String(stats.filed)} />
        <Fact label="Open now" value={String(stats.open)} />
        {stats.first && (
          <Fact label="First seen" value={whenText(stats.first)} />
        )}
        {stats.topCategory && (
          <Fact label="Most about" value={stats.topCategory} />
        )}

        <Caption>Also from them</Caption>
        {others.length === 0 ? (
          <p className="px-3.5 pb-3.5 text-[12px] text-content/95">
            Nothing else open or closed.
          </p>
        ) : (
          <div className="pb-3.5">
            {others.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className="block w-full border-t border-brand_line px-3.5 py-2 text-left transition-colors hover:bg-bkg"
              >
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                    {t.title}
                  </span>
                  <span className="flex-none text-[10.5px] text-content/95">
                    {whenText(t.updated_at)}
                  </span>
                </span>
                <span
                  className={`mt-1 inline-block rounded px-1.5 py-[1px] text-[10px] font-semibold ${STATUS_CLASS[t.status]}`}
                >
                  {STATUS_LABEL[t.status]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketSidebar;
