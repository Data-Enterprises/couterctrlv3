import type { Ticket } from "../../../api/tickets";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  alsoFrom,
  initialsOf,
  openerStats,
  stampText,
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
    <div className="flex h-full w-[248px] flex-none flex-col overflow-y-auto thin-scrollbar border-l border-brand_line bg-custom-white 2xl:w-[288px]">
      <div className="flex items-center gap-2.5 px-3.5 pt-3.5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand_slate text-[12px] font-bold text-custom-white">
          {initialsOf(ticket.opened_by_name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold">
            {ticket.opened_by_name}
          </span>
          <span className="block truncate font-mono text-[10.5px] text-content/85">
            {ticket.opened_by_username}
          </span>
        </span>
      </div>

      {ticket.company_name && (
        <div className="mt-2.5 px-3.5">
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

      <Caption>This ticket</Caption>
      <Fact label="Number" value={ticket.ticket_number} />
      <Fact label="Opened" value={whenText(ticket.created_at)} />
      {ticket.category_name && (
        <Fact label="Category" value={ticket.category_name} />
      )}
      <Fact
        label="Assigned"
        value={ticket.assigned_tech ?? "Nobody yet"}
      />
      {ticket.due_at && <Fact label="Due" value={stampText(ticket.due_at)} />}

      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3.5 pt-1.5">
          {ticket.labels.map((l) => (
            <span
              key={l.id}
              className="rounded px-1.5 py-[2px] text-[10px] font-semibold"
              style={{ background: `${l.color}22`, color: l.color }}
            >
              {l.name}
            </span>
          ))}
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
  );
};

export default TicketSidebar;
