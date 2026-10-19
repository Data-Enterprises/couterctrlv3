import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components-dev/Modal";
import Checkbox from "../../../components-dev/Checkbox";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import TextField from "../../../components-dev/inputs/TextField";
import { useDevApi } from "../../../hooks/useDevApi";
import { nextTechCode } from "./techCodes";
import { useToast } from "../../../components/toasts/hooks/useToast";
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
} from "../../../api/tickets";

interface Props {
  /** Level 9. Without it this is the read-only "On the desk" list. */
  canManageTechs: boolean;
  onClose: () => void;
  /** The roster decides who can be assigned, so the page's own assignee
   *  picker is stale the moment this changes anything. */
  onChanged: () => void;
}

/** What the sheet is doing. Three states rather than booleans, because they
 *  are mutually exclusive and a pair of flags lets them overlap. */
type Mode =
  | { kind: "list" }
  | { kind: "adding" }
  | { kind: "standing-down"; tech: TicketTech };

/**
 * The roster.
 *
 * One component with two faces. A programmer gets the switches, Add, and the
 * stood-down techs listed — bringing one back is half the job. Everybody else
 * on the desk gets the same list read-only, which is not a consolation: "who
 * else is on today and what are they carrying" is a real question before
 * picking up an unassigned ticket, and nothing else in the app answers it.
 *
 * Rows lead with the USERNAME. A tech is an account before it is a person:
 * the username is unique, it is what a log and a URL carry, and it assumes
 * nothing about who somebody is — nothing in `users` or `ticket_techs` says,
 * so nothing here implies. The display name keeps the second line, where
 * recognising a colleague still works.
 */
const TechsModal = ({ canManageTechs, onClose, onChanged }: Props) => {
  const { url, token } = useDevApi();
  const toast = useToast();

  const [techs, setTechs] = useState<TicketTech[] | null>(null);
  const [candidates, setCandidates] = useState<TechCandidate[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [working, setWorking] = useState(false);
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
  const shown = canManageTechs ? (techs ?? []) : active;

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
                Nobody is on the desk.
              </p>
            )}

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

/**
 * Taking somebody off the desk.
 *
 * Two things have to be said before it happens, and only the server knows
 * one of them. Their open tickets stay assigned unless they are handed over —
 * silently unassigning would lose who was working each one — and a
 * stood-down tech can no longer see the queue, so work left with them goes
 * quiet rather than moving.
 */
const StandDown = ({
  tech,
  others,
  working,
  onCancel,
  onConfirm,
}: {
  tech: TicketTech;
  others: TicketTech[];
  working: boolean;
  onCancel: () => void;
  onConfirm: (reassignTo?: number) => void;
}) => {
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
            <b className="font-semibold">They are the last active tech.</b>{" "}
            With nobody on the desk a new ticket notifies no one. It still
            arrives and still waits in the queue.
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

/**
 * Putting somebody on it.
 *
 * The list is the server's: active staff on the support domain who are not
 * already here. Everyone in it can be added, which is why it is asked for
 * rather than filtered out of the whole user table in the browser.
 */
const AddTech = ({
  candidates,
  techs,
  working,
  onCancel,
  onConfirm,
}: {
  candidates: TechCandidate[];
  /** Every tech on the desk, stood down ones included -- the codes already
   *  taken, which is what makes the next one knowable. */
  techs: TicketTech[];
  working: boolean;
  onCancel: () => void;
  onConfirm: (body: {
    userid: number;
    display_name?: string;
    tech_code?: string;
  }) => void;
}) => {
  const [userid, setUserid] = useState("");
  const [shownAs, setShownAs] = useState("");
  const [code, setCode] = useState("");
  /** Until somebody edits the field it follows the pick, which is what lets a
   *  returning tech's own code replace the next one without a race between
   *  two bits of state. */
  const [codeEdited, setCodeEdited] = useState(false);
  const picked = candidates.find((c) => String(c.userid) === userid);

  const nextCode = useMemo(() => nextTechCode(techs), [techs]);
  // A returning tech keeps the row they had, so the code that comes back is
  // theirs -- offering them the next one would read as a renumbering.
  const suggested = picked?.was_a_tech
    ? (picked.previous_tech_code ?? "")
    : (nextCode ?? "");
  const codeValue = codeEdited ? code : suggested;

  return (
    <>
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5">
        <h2 className="text-[15.5px] font-semibold">Add a tech</h2>
        <p className="mt-1 text-[12px] text-content/85">
          Support staff only — anyone on the company domain.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto thin-scrollbar px-4 pb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">Who</span>
          <SelectFilter
            plain
            searchable
            searchPlaceholder="Find a name…"
            placeholder="Nobody yet"
            options={candidates.map((c) => ({
              value: String(c.userid),
              label: `${c.username} · ${c.name}${c.was_a_tech ? " · was a tech" : ""}`,
            }))}
            value={userid}
            onChange={setUserid}
            className="w-full"
          />
        </label>

        {candidates.length === 0 && (
          <p className="text-[12px] text-content/85">
            Everybody eligible is already on the desk.
          </p>
        )}

        <div className="flex gap-2.5">
          <div className="flex-1">
            <TextField
              label="Shown as"
              value={shownAs}
              placeholder={picked?.name ?? "their own name"}
              onChange={setShownAs}
            />
          </div>
          <div className="flex-1">
            <TextField
              label="Code"
              value={codeValue}
              placeholder={picked?.previous_tech_code ?? "the next one"}
              onChange={(v) => {
                setCodeEdited(true);
                setCode(v);
              }}
            />
          </div>
        </div>

        {/* Said before the press rather than discovered after it: one row per
            user, so this is an upsert and the id survives. */}
        {picked?.was_a_tech && (
          <div className="rounded-lg bg-severity_healthy_bg px-3 py-2.5 text-[12px] leading-relaxed text-severity_healthy_text">
            <b className="font-semibold">{picked.username} was a tech before.</b>{" "}
            Adding them brings back{" "}
            {picked.previous_tech_code ?? "their row"} with their history,
            rather than making a second one.
          </div>
        )}
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
          disabled={working || !picked}
          onClick={() =>
            picked &&
            onConfirm({
              userid: picked.userid,
              ...(shownAs.trim() ? { display_name: shownAs.trim() } : {}),
              ...(codeValue.trim() ? { tech_code: codeValue.trim() } : {}),
            })
          }
          className="rounded-lg bg-brand_navy px-4 py-1.5 text-[12.5px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-40"
        >
          {working ? "Adding…" : picked?.was_a_tech ? "Bring back" : "Add"}
        </button>
      </div>
    </>
  );
};

export default TechsModal;
