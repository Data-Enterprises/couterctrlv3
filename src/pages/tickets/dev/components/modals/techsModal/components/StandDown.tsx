// Hooks
import { useState } from "react";

// Interfaces
import type { TicketTech } from "../../../../../../../api/tickets";

// Components
import SelectFilter from "../../../../../../../components-dev/filters/SelectFilter";

interface StandDownProps {
  tech: TicketTech;
  others: TicketTech[];
  working: boolean;
  onCancel: () => void;
  onConfirm: (reassignTo?: number) => void;
}

/** The Techs sheet's "Stand down" confirmation: warns about open tickets and the last active tech,
 *  and lets the manager hand their tickets to another tech. */
const StandDown = ({
  tech,
  others,
  working,
  onCancel,
  onConfirm,
}: StandDownProps) => {
  const [to, setTo] = useState("");
  const holding = tech.ticket_count;
  const last = others.length === 0;

  return (
    <>
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[15.5px] font-semibold">
          Stand {tech.username} down?
        </h2>
        <p className="mt-1 text-[12px] text-content/85">
          They come off the picker and stop being emailed about new tickets.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto thin-scrollbar px-4 pb-4">
        {holding > 0 && (
          <div className="rounded-lg bg-severity_watch_bg px-3 py-2.5 text-[12px] leading-relaxed text-severity_watch_text">
            <b className="font-semibold">
              {holding} open ticket{holding === 1 ? "" : "s"}
            </b>{" "}
            {holding === 1 ? "is" : "are"} assigned to them. Off the desk they
            cannot see the queue, so anything left with them stops moving.
          </div>
        )}

        {holding > 0 && others.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium">
              Hand them to{" "}
              <span className="font-normal text-content/85">— optional</span>
            </span>
            <SelectFilter
              plain
              searchable
              searchPlaceholder="Find a tech…"
              placeholder="Leave them where they are"
              options={others.map((o) => ({
                value: String(o.userid),
                label: `${o.username} · holding ${o.ticket_count}`,
              }))}
              value={to}
              onChange={setTo}
              className="w-full"
            />
          </label>
        )}

        {last && (
          <div className="rounded-lg bg-severity_watch_bg px-3 py-2.5 text-[12px] leading-relaxed text-severity_watch_text">
            <b className="font-semibold">They are the last active tech.</b> With
            nobody on the desk a new ticket notifies no one. It still arrives
            and still waits in the queue.
            {holding > 0 && " There is also nobody to hand their work to."}
          </div>
        )}

        <p className="text-[12px] text-content/85">
          Bringing them back later restores the same tech, with the same code
          and the same history.
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 border-t border-brand_line px-4 py-3">
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-brand_line_2 px-4 py-1.5 text-[12.5px] font-medium transition-colors hover:border-brand_slate"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={working}
          onClick={() => onConfirm(to ? Number(to) : undefined)}
          className="rounded-lg bg-brand_navy px-4 py-1.5 text-[12.5px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-40"
        >
          {working ? "Working…" : "Stand down"}
        </button>
      </div>
    </>
  );
};

export default StandDown;
