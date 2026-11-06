// Utils
import {
  PRIORITY_CLASS,
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../../utils/ticketsUtils";

// Interfaces
import type { Ticket } from "../../../../../../api/tickets";

interface DetailHeaderProps {
  ticket: Ticket;
}

const DetailHeader = ({ ticket }: DetailHeaderProps) => {
  return (
    <div className="flex-shrink-0 rounded-t-xl bg-brand_navy text-custom-white px-4 py-3 flex items-center gap-2.5 flex-wrap">
      <span className="font-mono text-[12.5px] text-custom-white/85">
        {ticket.ticket_number}
      </span>
      <h2 className="text-[16px] font-semibold flex-1 min-w-0 truncate">
        {ticket.title}
      </h2>
      <span
        className={`text-[11.5px] font-semibold rounded px-2 py-0.5 ${STATUS_CLASS[ticket.status]}`}
      >
        {STATUS_LABEL[ticket.status]}
      </span>
      <span
        className={`text-[11.5px] font-semibold rounded px-2 py-0.5 ${
          PRIORITY_CLASS[ticket.priority] ?? PRIORITY_CLASS.normal
        }`}
      >
        {ticket.priority[0].toUpperCase() + ticket.priority.slice(1)}
      </span>
    </div>
  );
};

export default DetailHeader;
