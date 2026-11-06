// Hooks
import { useMemo, useState } from "react";

// Utils
import { nextTechCode } from "../../utils/techCodes";

// Interfaces
import type {
  TechCandidate,
  TicketTech,
} from "../../../../../../../api/tickets";

// Components
import SelectFilter from "../../../../../../../components-dev/filters/SelectFilter";
import TextField from "../../../../../../../components-dev/inputs/TextField";

interface AddTechProps {
  candidates: TechCandidate[];
  techs: TicketTech[];
  working: boolean;
  onCancel: () => void;
  onConfirm: (body: {
    userid: number;
    display_name?: string;
    tech_code?: string;
  }) => void;
}

const AddTech = ({
  candidates,
  techs,
  working,
  onCancel,
  onConfirm,
}: AddTechProps) => {
  const [userid, setUserid] = useState("");
  const [shownAs, setShownAs] = useState("");
  const picked = candidates.find((c) => String(c.userid) === userid);

  const nextCode = useMemo(() => nextTechCode(techs), [techs]);
  /**
   * The code this tech will have, shown and not typed. A returning tech shows
   * their own row's code, since adding them brings that row back.
   */
  const codeValue = picked?.was_a_tech
    ? (picked.previous_tech_code ?? nextCode)
    : nextCode;

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
          {/* Sits level with "Shown as" but is plainly not an input. */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[12px] font-medium text-content">Code</span>
            <span className="flex items-center rounded border border-brand_line bg-bkg px-1.5 py-1">
              <span className="text-[12px] font-medium tabular-nums text-content">
                {codeValue}
              </span>
            </span>
            <span className="text-[11px] text-content/55">
              {picked?.was_a_tech ? "The code on their row" : "The next one"}
            </span>
          </div>
        </div>

        {/* Said before the press rather than discovered after it: one row per
            user, so this is an upsert and the id survives. */}
        {picked?.was_a_tech && (
          <div className="rounded-lg bg-severity_healthy_bg px-3 py-2.5 text-[12px] leading-relaxed text-severity_healthy_text">
            <b className="font-semibold">
              {picked.username} was a tech before.
            </b>{" "}
            Adding them brings back {picked.previous_tech_code ?? "their row"}{" "}
            with their history, rather than making a second one.
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

export default AddTech;
