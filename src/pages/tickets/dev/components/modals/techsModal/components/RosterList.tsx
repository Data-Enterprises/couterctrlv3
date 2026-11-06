// Hooks
import { useDevApi } from "../../../../../../../hooks/useDevApi";
import { useToast } from "../../../../../../../components/toasts/hooks/useToast";

// API
import {
  updateTicketTech,
  ticketFailed,
} from "../../../../../../../api/tickets";

// Utils
import { SEARCHABLE_FROM } from "../../../modals/utils";

// Interfaces
import type { Mode } from "../../interfaces";
import type { SetStateAction } from "react";
import type { TicketTech } from "../../../../../../../api/tickets";
import type { TechWriteResp } from "../../../../../../../api/tickets";

// Components
import TextFilter from "../../../../../../../components-dev/filters/TextFilter";
import Checkbox from "../../../../../../../components-dev/Checkbox";

interface RosterListProps {
  techs: TicketTech[] | null;
  active: TicketTech[];
  shown: TicketTech[];
  canManageTechs: boolean;
  roster: TicketTech[];
  query: string;
  setQuery: (query: string) => void;
  problem: string | null;
  needle: string;
  setWorking: (value: SetStateAction<boolean>) => void;
  after: (j: TechWriteResp, said: string) => TechWriteResp;
  setMode: (value: SetStateAction<Mode>) => void;
  onClose: () => void;
}

const RosterList = ({
  techs,
  active,
  shown,
  canManageTechs,
  roster,
  query,
  setQuery,
  problem,
  needle,
  setWorking,
  after,
  setMode,
  onClose,
}: RosterListProps) => {
  const { url, token } = useDevApi();
  const toast = useToast();
  return (
    <>
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[15.5px] font-semibold">
          {canManageTechs ? "Ticket techs" : "On the desk"}
        </h2>
        <p className="mt-1 text-[12px] text-content/85">
          Who tickets can be assigned to.
          {techs ? ` ${active.length} active.` : ""}
        </p>
      </div>

      {/* A search only once the desk is past a handful of techs. */}
      {roster.length > SEARCHABLE_FROM && (
        <div className="flex-shrink-0 px-4 pb-2">
          <TextFilter
            value={query}
            onChange={setQuery}
            placeholder="Find a tech by name or code…"
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto thin-scrollbar px-4 pb-4">
        {problem && (
          <div className="rounded-lg border border-severity_watch_text/25 bg-severity_watch_bg px-3 py-2 text-[12px] text-severity_watch_text">
            {problem}
          </div>
        )}

        {techs === null && !problem && (
          <p className="py-6 text-center text-[12.5px] text-content/85">
            Reading the roster…
          </p>
        )}

        {techs !== null && shown.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-content/85">
            {needle
              ? `Nobody on the desk matches “${query.trim()}”.`
              : "Nobody is on the desk."}
          </p>
        )}
        {/* TechRow list. the returned map is TechRow.tsx */}
        {shown.map((tech) => (
          <div
            key={tech.tech_id}
            className={`flex items-center gap-3 rounded-lg border border-brand_line px-2.5 py-2 ${
              tech.is_active ? "bg-custom-white" : "bg-bkg"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[12.5px] font-semibold">
                {tech.username}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] text-content/85">
                {tech.tech_code ?? "no code"} · {tech.name}
                {/* The one failure this sheet cannot fix: the tech row is
                                one thing, the account behind it another. */}
                {tech.user_active === 0 && (
                  <span className="rounded bg-severity_critical_bg px-1.5 py-[1px] font-semibold uppercase tracking-wide text-severity_critical_text">
                    no sign-in
                  </span>
                )}
              </span>
            </span>

            <span className="flex-none text-right text-[11px] text-content/85">
              <b className="block font-display text-[15px] font-bold text-content">
                {tech.ticket_count}
              </b>
              holding
            </span>

            {canManageTechs && (
              <Checkbox
                checked={tech.is_active}
                ariaLabel={
                  tech.is_active
                    ? `Stand ${tech.username} down`
                    : `Bring ${tech.username} back`
                }
                onChange={(on) => {
                  if (on) {
                    setWorking(true);
                    void updateTicketTech(url, token, tech.tech_id, {
                      is_active: true,
                    })
                      .then((resp) => {
                        const j = resp.data as TechWriteResp;
                        if (ticketFailed(j)) {
                          toast.error("That did not stick.");
                          return;
                        }
                        after(j, `${tech.username} is back on the desk`);
                      })
                      .catch(() => toast.error("That did not stick."))
                      .finally(() => setWorking(false));
                  } else {
                    // Never without asking: it decides what happens to
                    // open work, and the answer is not obvious.
                    setMode({ kind: "standing-down", tech });
                  }
                }}
              />
            )}
          </div>
        ))}

        {!canManageTechs && techs !== null && (
          <p className="mt-2 text-[12px] text-content/85">
            Adding or standing down a tech is a programmer's job.
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 border-t border-brand_line px-4 py-3">
        {canManageTechs && (
          <button
            type="button"
            onClick={() => setMode({ kind: "adding" })}
            className="rounded-lg bg-brand_navy px-4 py-1.5 text-[12.5px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover"
          >
            Add a tech
          </button>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-brand_line_2 px-4 py-1.5 text-[12.5px] font-medium transition-colors hover:border-brand_slate"
        >
          Close
        </button>
      </div>
    </>
  );
};

export default RosterList;
