// Hooks
import { useState } from "react";
import { useTicketsCtx } from "../../hooks";

// Redux
import { openClosing } from "../../../../../features/dev/devTicketsSlice";

// Components
import Modal from "../../../../../components-dev/Modal";
import ClosedOptions from "./components/ClosedOptions";

/**
 * The resolution is required (the endpoint answers 400 without it) and posts
 * to the thread as a visible reply, which is how the client hears what was done.
 */
const CloseTicketModal = () => {
  const ctx = useTicketsCtx();
  const [resolution, setResolution] = useState("");
  const [kind, setKind] = useState("fixed");

  const close = () => ctx.dispatch(openClosing(false));
  const ticket = ctx.detail;

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
          <p className="text-[12.5px] text-content/95 mt-1">
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
          <ClosedOptions kind={kind} setKind={setKind} />
          <span className="text-[11px] text-content/95">
            Stored as a label on the ticket. It is what makes the archive worth
            reading a year from now.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {resolution.trim() === "" && (
            <span className="text-[11.5px] text-severity_watch_text">
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
