// Utils
import { outcomeSentence } from "../hooks";

// Interfaces
import type { AccessOutcome } from "../interfaces";

interface SaveFailureNoteProps {
  failure: AccessOutcome;
}

/** Said when access did not finish saving: what did, why, and that the rest
 *  is still on screen to send again. */
const SaveFailureNote = ({ failure }: SaveFailureNoteProps) => (
  <div className="mb-3 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
    <div className="text-[12.5px] font-semibold text-content">
      Access didn’t finish saving.
    </div>
    <div className="text-[11.5px] text-content/95">
      {outcomeSentence(failure)}
      {failure.reason ? ` ${failure.reason}` : ""} What did save has been
      re-read, and your changes are still on screen. Press Save changes to send
      the rest.
    </div>
  </div>
);

export default SaveFailureNote;
