import type { Ticket } from "../../../api/tickets";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  alsoFrom,
  initialsOf,
  openerStats,
  whenText,
} from "./ticketsUtils";

interface Props {
  ticket: Ticket;
  /** The whole queue, already in memory — this panel makes no calls. */
  tickets: Ticket[];
  onSelect: (id: number) => void;
}

const Caption = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3.5 pb-1.5 pt-3.5 font-mono text-[9.5px] uppercase tracking-wider text-content/85">
    {children}
  </div>
);

const Fact = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-3 px-3.5 py-[5px] text-[12px]">
    <span className="text-content/85">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);

/**
 * Who filed this, and what else they have filed.
 *
 * Only that. The ticket's own facts — its number, when it was opened, its
 * category, who has it — sit under the thread's header instead, where what a
 * ticket IS is beside the conversation it belongs to rather than two columns
 * away from it.
 *
 * Every figure here is read off the queue the page already holds, so opening
 * a ticket costs nothing extra. That is also the panel's limit: it can say
 * how somebody uses the help desk and not who they are. An email, a phone
 * number and a photo live on the users table and are not on a ticket row —
 * when they arrive this panel gains a block above the stats and loses
 * nothing.
 *
 * The company block is their store rather than a shopper's account. The
 * commerce figures an inbox usually puts here — spend, orders, average order
 * — would be about the wrong party: our customer is the store, and what the
 * help desk knows about a store is its history of asking for help.
 */
const TicketSidebar = ({ ticket, tickets, onSelect }: Props) => {
  const stats = openerStats(tickets, ticket);
  const others = alsoFrom(tickets, ticket);

  return (
    <div className="flex h-full w-[248px] flex-none flex-col overflow-hidden rounded-xl bg-custom-white shadow-lg 2xl:w-[288px]">
      <div className="flex-shrink-0 rounded-t-xl bg-brand_navy px-4 pt-1 pb-2.5">
        <div className="flex min-h-[24px] items-end gap-3">
          <span className="flex-shrink-0 text-[13px] font-semibold text-custom-white">
            Who sent it
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 border-t border-custom-white/[0.08] pt-1.5">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-custom-white/15 text-[10px] font-bold text-custom-white">
            {initialsOf(ticket.opened_by_name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-semibold text-custom-white">
              {ticket.opened_by_name}
            </span>
            <span className="block truncate font-mono text-[10px] text-custom-white/85">
              {ticket.opened_by_username}
            </span>
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">

      {ticket.company_name && (
        <div className="mt-3 px-3.5">
          <div className="rounded-lg bg-bkg px-2.5 py-2">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
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
        <p className="px-3.5 pb-3.5 text-[12px] text-content/85">
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
                <span className="flex-none text-[10.5px] text-content/85">
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
