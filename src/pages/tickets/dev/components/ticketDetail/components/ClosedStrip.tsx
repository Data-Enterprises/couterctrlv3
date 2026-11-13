// Utils
import { stampText, resolutionLabel } from "../../../utils/ticketsUtils";

// Interfaces
import type { Ticket, TicketStatus } from "../../../../../../api/tickets";

// Components
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface ClosedStripProps {
  ticket: Ticket;
  canManage: boolean;
  working: boolean;
  move: (
    status: TicketStatus,
    resolution?: string,
    resolutionType?: string,
  ) => void;
}

/** The green strip on a closed ticket: when it closed and how it was resolved, with a Reopen link for managers. */
const ClosedStrip = ({
  ticket,
  canManage,
  working,
  move,
}: ClosedStripProps) => {
  return (
    <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 bg-brand_green_tint border-b border-brand_line">
      <CheckCircleIcon className="w-4 h-4 text-brand_green_darker flex-shrink-0" />
      <span className="text-[12.5px] font-semibold text-brand_green_darker">
        Closed{ticket.closed_at ? ` ${stampText(ticket.closed_at)}` : ""}
      </span>
      {resolutionLabel(ticket) && (
        <span className="text-[11.5px] text-brand_green_darker">
          · {resolutionLabel(ticket)}
        </span>
      )}
      <div className="flex-1" />
      {canManage && (
        <button
          type="button"
          onClick={() => move("open")}
          disabled={working}
          className="text-[11.5px] font-semibold text-brand_green_darker underline underline-offset-2 disabled:opacity-40"
        >
          Reopen it
        </button>
      )}
    </div>
  );
};

export default ClosedStrip;
