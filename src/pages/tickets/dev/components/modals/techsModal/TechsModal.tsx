// Hooks
import { useEffect, useState } from "react";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useDevApi } from "../../../../../../hooks/useDevApi";

// API
import {
  createTicketTech,
  listTechCandidates,
  listTicketTechs,
  ticketFailed,
  updateTicketTech,
  type TechCandidate,
  type TechCandidatesResp,
  type TechWriteResp,
  type TicketTech,
  type TicketTechsResp,
} from "../../../../../../api/tickets";

// Interfaces
import type { Mode } from "../interfaces";

// Components
import Modal from "../../../../../../components-dev/Modal";
import StandDown from "./components/StandDown";
import AddTech from "./components/AddTech";
import RosterList from "./components/RosterList";

interface Props {
  canManageTechs: boolean; //Level 9 only (Programmer)
  onClose: () => void;
  onChanged: () => void;
}

/**
 * The roster. A programmer gets the switches, Add and the stood-down techs;
 * everyone else on the desk gets the same list read-only. Rows lead with the
 * username, which is unique; the display name is the second line.
 */
const TechsModal = ({ canManageTechs, onClose, onChanged }: Props) => {
  const { url, token } = useDevApi();
  const toast = useToast();

  const [techs, setTechs] = useState<TicketTech[] | null>(null);
  const [candidates, setCandidates] = useState<TechCandidate[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [working, setWorking] = useState(false);
  const [query, setQuery] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  const load = () => {
    setProblem(null);
    listTicketTechs(url, token)
      .then((resp) => {
        const j = resp.data as TicketTechsResp;
        if (ticketFailed(j)) {
          setProblem("The roster could not be read.");
          return;
        }
        setTechs(j.techs ?? []);
      })
      .catch(() => setProblem("The roster could not be read."));
  };

  useEffect(load, [url, token]);

  // Only a programmer can add, so only a programmer pays for the list.
  useEffect(() => {
    if (!canManageTechs) return;
    listTechCandidates(url, token)
      .then((resp) => {
        const j = resp.data as TechCandidatesResp;
        if (!ticketFailed(j)) setCandidates(j.candidates ?? []);
      })
      .catch(() => {
        /* Adding is simply unavailable; the roster still reads. */
      });
  }, [url, token, canManageTechs]);

  const active = (techs ?? []).filter((t) => t.is_active);
  // A tech reads the desk as it is. A programmer maintains it, and that
  // includes the people currently off it.
  const roster = canManageTechs ? (techs ?? []) : active;

  // Username, display name and code, because any of the three is what
  // somebody has in their head when they come looking for a tech.
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? roster.filter((t) =>
        [t.username, t.display_name, t.name, t.tech_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      )
    : roster;

  const after = (j: TechWriteResp, said: string) => {
    toast.success(said);
    setMode({ kind: "list" });
    load();
    onChanged();
    return j;
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      /* Own edges: the footer's hairline has to reach them, which the
         default inset would stop it doing. */
      padded={false}
      modalClassName="bg-card_bg flex max-h-[86vh] w-[600px] max-w-[94vw] flex-col overflow-hidden"
    >
      {mode.kind === "list" && (
        <RosterList
          techs={techs}
          active={active}
          shown={shown}
          canManageTechs={canManageTechs}
          roster={roster}
          query={query}
          setQuery={setQuery}
          problem={problem}
          needle={needle}
          setWorking={setWorking}
          after={after}
          setMode={setMode}
          onClose={onClose}
        />
      )}

      {mode.kind === "standing-down" && (
        <StandDown
          tech={mode.tech}
          others={active.filter((t) => t.tech_id !== mode.tech.tech_id)}
          working={working}
          onCancel={() => setMode({ kind: "list" })}
          onConfirm={(reassignTo) => {
            setWorking(true);
            void updateTicketTech(url, token, mode.tech.tech_id, {
              is_active: false,
              ...(reassignTo ? { reassign_to: reassignTo } : {}),
            })
              .then((resp) => {
                const j = resp.data as TechWriteResp;
                if (ticketFailed(j)) {
                  toast.error("That did not stick.");
                  return;
                }
                after(
                  j,
                  j.reassigned
                    ? `${mode.tech.username} is off the desk; ${j.reassigned} ticket${
                        j.reassigned === 1 ? "" : "s"
                      } moved`
                    : `${mode.tech.username} is off the desk`,
                );
              })
              .catch(() => toast.error("That did not stick."))
              .finally(() => setWorking(false));
          }}
        />
      )}

      {mode.kind === "adding" && (
        <AddTech
          candidates={candidates}
          techs={techs ?? []}
          working={working}
          onCancel={() => setMode({ kind: "list" })}
          onConfirm={(body) => {
            setWorking(true);
            void createTicketTech(url, token, body)
              .then((resp) => {
                const j = resp.data as TechWriteResp;
                if (ticketFailed(j)) {
                  toast.error(j.msg ?? "That did not stick.");
                  return;
                }
                const who = j.tech?.username ?? "They";
                after(
                  j,
                  j.reactivated
                    ? `${who} is back on the desk`
                    : `${who} is on the desk`,
                );
              })
              .catch(() => toast.error("That did not stick."))
              .finally(() => setWorking(false));
          }}
        />
      )}
    </Modal>
  );
};

export default TechsModal;
