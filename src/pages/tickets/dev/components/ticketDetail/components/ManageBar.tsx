// Interfaces
import type { Ticket, TicketStatus } from "../../../../../../api/tickets";

// Components
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";
import { openClosing } from "../../../../../../features/dev/devTicketsSlice";

interface ManageBarProps {
  ticket: Ticket;
  ctx: any;
  closed: boolean;
  assigneeOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  setStoresOpen: (open: boolean) => void;
}

const ManageBar = ({
  ticket,
  ctx,
  closed,
  assigneeOptions,
  statusOptions,
  setStoresOpen,
}: ManageBarProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ticket.assignee_id !== ctx.userid && !closed && (
        <button
          type="button"
          onClick={() => ctx.assign(ctx.userid)}
          disabled={ctx.working}
          className="text-[12.5px] font-semibold px-3 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40"
        >
          Take it
        </button>
      )}
      <SelectFilter
        plain
        searchable
        searchPlaceholder="Find a tech..."
        placeholder="Unassigned"
        options={assigneeOptions}
        value={ticket.assignee_id ? String(ticket.assignee_id) : ""}
        onChange={(value) => ctx.assign(value ? Number(value) : null)}
        className="w-[190px]"
      />
      <SelectFilter
        plain
        placeholder="Status"
        options={statusOptions}
        value={ticket.status}
        onChange={(value) => {
          // Closing is the one move that needs something first.
          if (value === "closed") ctx.dispatch(openClosing(true));
          else if (value) ctx.move(value as TicketStatus);
        }}
        className="w-[160px]"
      />
      {ticket.stores && (
        <button
          type="button"
          onClick={() => setStoresOpen(true)}
          disabled={ctx.working}
          title="Change which stores this ticket is about"
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
        >
          Edit stores
        </button>
      )}
    </div>
  );
};

export default ManageBar;
