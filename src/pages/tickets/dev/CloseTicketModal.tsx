import { useState } from "react";
import Modal from "../../../components-dev/Modal";
import { openClosing } from "../../../features/dev/devTicketsSlice";
import type { TicketsCtx } from "./hooks";

/**
 * Closing one.
 *
 * The resolution is required — the endpoint answers 400 without it — and it
 * posts to the thread as a VISIBLE reply, which is how the client is told what
 * was done. It is the one field nobody can supply retroactively, which is why
 * closing is its own endpoint rather than another field on a PATCH.
 *
 * The kind of fix is stored as a `type:` label. That is what turns a year of
 * tickets into something answerable later.
 */
const CloseTicketModal = ({ ctx }: { ctx: TicketsCtx }) => {
  const [resolution, setResolution] = useState("");
  const [kind, setKind] = useState("fixed");

  const close = () => ctx.dispatch(openClosing(false));
  const ticket = ctx.detail;

  const kinds = ctx.lookups?.resolutionTypes ?? [
    { value: "fixed", description: "Fixed" },
    { value: "config", description: "Config" },
    { value: "user_error", description: "User error" },
    { value: "no_action", description: "No action" },
    { value: "duplicate", description: "Duplicate" },
  ];

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[620px] max-w-[94vw]"
    >
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-[17px] font-semibold">
            Close {ticket?.ticket_number ?? "this ticket"}
          </h2>
          <p className="text-[12.5px] text-content/85 mt-1">
            What you write here is posted to the thread, so it is what the
            client reads.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium">What was done</span>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
            placeholder="Firmware was two versions behind. Updated to 4.2.1 and ran forty receipts clean."
            className="w-full border border-brand_line rounded-lg px-3 py-2 text-[13.5px] resize-none bg-custom-white"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-medium">What kind of fix</span>
          <div className="flex flex-wrap gap-2">
            {kinds.map((option) => (
              <label
                key={option.value}
                htmlFor={`kind-${option.value}`}
                className={`flex items-center gap-2 text-[12.5px] rounded-lg px-3 py-2 border transition-colors ${
                  kind === option.value
                    ? "bg-filter_active border-filter_active_border"
                    : "bg-custom-white border-brand_line hover:border-brand_slate"
                }`}
              >
                <input
                  id={`kind-${option.value}`}
                  type="radio"
                  name="resolution-kind"
                  checked={kind === option.value}
                  onChange={() => setKind(option.value)}
                  className="w-4 h-4"
                />
                {option.description}
              </label>
            ))}
          </div>
          <span className="text-[11px] text-content/85">
            Stored as a label on the ticket. It is what makes the archive worth
            reading a year from now.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {resolution.trim() === "" && (
            <span className="text-[11.5px] text-amber-900">
              A close without a resolution is refused — nobody can add one
              afterwards.
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={close}
            className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => ctx.move("closed", resolution.trim(), kind)}
            disabled={resolution.trim() === "" || ctx.working}
            className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_green text-custom-white hover:bg-brand_green_dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close the ticket
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CloseTicketModal;
