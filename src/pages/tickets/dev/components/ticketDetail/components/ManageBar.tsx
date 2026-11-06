// Redux
import { openClosing } from "../../../../../../features/dev/devTicketsSlice";

// Interfaces
import type { Ticket, TicketStatus } from "../../../../../../api/tickets";
import type { AppDispatch } from "../../../../../../store";

// Components
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";

interface ManageBarProps {
  ticket: Ticket;
  userid: number;
  working: boolean;
  closed: boolean;
  dispatch: AppDispatch;
  assigneeOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  setStoresOpen: (open: boolean) => void;
  assign: (assigneeId: number | null) => void;
  move: (status: TicketStatus, resolution?: string, resolutionType?: string) => void;
}

const ManageBar = ({
  ticket,
  closed,
  assigneeOptions,
  statusOptions,
  setStoresOpen,
  userid,
  assign,
  working,
  move,
  dispatch,
}: ManageBarProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ticket.assignee_id !== userid && !closed && (
        <button
          type="button"
          onClick={() => assign(userid)}
          disabled={working}
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
        onChange={(value) => assign(value ? Number(value) : null)}
        className="w-[190px]"
      />
      <SelectFilter
        plain
        placeholder="Status"
        options={statusOptions}
        value={ticket.status}
        onChange={(value) => {
          // Closing is the one move that needs something first.
          if (value === "closed") dispatch(openClosing(true));
          else if (value) move(value as TicketStatus);
        }}
        className="w-[160px]"
      />
      {ticket.stores && (
        <button
          type="button"
          onClick={() => setStoresOpen(true)}
          disabled={working}
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
