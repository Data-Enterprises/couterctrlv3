// Hooks
import { useDevApi } from "../../../../../../../hooks/useDevApi";
import { useToast } from "../../../../../../../components/toasts/hooks/useToast";

// API
import {
  updateTicketTech,
  ticketFailed,
} from "../../../../../../../api/tickets";

// Interfaces
import type { Mode } from "../../interfaces";
import type { SetStateAction } from "react";
import type { TechWriteResp, TicketTech } from "../../../../../../../api/tickets";

// Components
import Checkbox from "../../../../../../../components-dev/Checkbox";

interface TechRowProps {
  tech: TicketTech;
  canManageTechs: boolean;
  setWorking: (value: SetStateAction<boolean>) => void;
  after: (j: TechWriteResp, said: string) => TechWriteResp;
  setMode: (value: SetStateAction<Mode>) => void;
}

/** One tech on the roster: username, code, name, tickets held, and (managers only) a checkbox that brings them back or opens the stand-down sheet. */
const TechRow = ({
  tech,
  canManageTechs,
  setWorking,
  after,
  setMode,
}: TechRowProps) => {
  const { url, token } = useDevApi();
  const toast = useToast();
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-brand_line px-2.5 py-2 ${
        tech.is_active ? "bg-custom-white" : "bg-bkg"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[12.5px] font-semibold">
          {tech.username}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] text-content/95">
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

      <span className="flex-none text-right text-[11px] text-content/95">
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
  );
};

export default TechRow;
