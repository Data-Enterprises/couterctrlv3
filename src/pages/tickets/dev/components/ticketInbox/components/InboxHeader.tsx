// Utils
import { SCOPE_HEADING } from "../../../utils";

// Interfaces
import type { TicketScope, Ticket } from "../../../../../../api/tickets";

// Components
import PageInfoButton from "../../../../../../components-dev/PageInfoButton";

interface InboxHeaderProps {
  isTech: boolean;
  scope: TicketScope | null;
  onTechs: (() => void) | undefined;
  rows: Ticket[];
}

/** The navy bar over the ticket list: the queue heading, a Techs button when available, the help button and how many tickets are showing. */
const InboxHeader = ({ isTech, scope, onTechs, rows }: InboxHeaderProps) => {
  return (
    <div className="flex-shrink-0 rounded-t-xl bg-brand_navy px-4 py-2.5 flex items-end gap-3">
      <span className="flex-shrink-0 text-[13px] cc-navy-title">
        {isTech ? "Queue" : scope ? SCOPE_HEADING[scope] : "Your tickets"}
      </span>
      {/* Who is on the desk: a fact about the queue, so it sits up here. */}
      {onTechs && (
        <button
          type="button"
          onClick={onTechs}
          title="Who tickets can be assigned to"
          className="flex-shrink-0 rounded-md border border-custom-white/25 px-2 py-[3px] text-[11px] font-medium cc-navy-link hover:border-custom-white"
        >
          Techs
        </button>
      )}
      <div className="flex-1" />
      <div className="relative flex-shrink-0">
        <PageInfoButton page="help-desk" />
      </div>
      <div className="flex flex-shrink-0 items-baseline gap-1">
        <span className="text-[10px] uppercase tracking-wide text-custom-white/95">
          Showing
        </span>
        <span className="text-[13px] font-medium tabular-nums text-custom-white">
          {rows.length}
        </span>
      </div>
    </div>
  );
};

export default InboxHeader;
