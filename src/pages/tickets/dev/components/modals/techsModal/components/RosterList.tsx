// Utils
import { SEARCHABLE_FROM } from "../../../modals/utils";

// Interfaces
import type { Mode } from "../../interfaces";
import type { SetStateAction } from "react";
import type { TechWriteResp, TicketTech } from "../../../../../../../api/tickets";

// Components
import TextFilter from "../../../../../../../components-dev/filters/TextFilter";
import TechRow from "./TechRow";

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

/** The Techs sheet's roster view: the techs on the desk with a search once the list is long, plus Add a tech (managers only) and Close. */
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
  return (
    <>
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[15.5px] font-semibold">
          {canManageTechs ? "Ticket techs" : "On the desk"}
        </h2>
        <p className="mt-1 text-[12px] text-content/95">
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

      <div className="flex cc-scroll flex-col gap-1.5 px-4 pb-4">
        {problem && (
          <div className="rounded-lg border border-severity_watch_text/25 bg-severity_watch_bg px-3 py-2 text-[12px] text-severity_watch_text">
            {problem}
          </div>
        )}

        {techs === null && !problem && (
          <p className="py-6 text-center text-[12.5px] text-content/95">
            Reading the roster…
          </p>
        )}

        {techs !== null && shown.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-content/95">
            {needle
              ? `Nobody on the desk matches “${query.trim()}”.`
              : "Nobody is on the desk."}
          </p>
        )}
        {shown.map((tech) => (
          <TechRow
            key={tech.tech_id}
            tech={tech}
            canManageTechs={canManageTechs}
            setWorking={setWorking}
            after={after}
            setMode={setMode}
          />
        ))}

        {!canManageTechs && techs !== null && (
          <p className="mt-2 text-[12px] text-content/95">
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
          className="cc-btn-outline text-[12.5px]"
        >
          Close
        </button>
      </div>
    </>
  );
};

export default RosterList;
