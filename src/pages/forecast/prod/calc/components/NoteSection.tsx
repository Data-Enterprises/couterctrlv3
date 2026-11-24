// Utils
import { SECTION } from "../utils";

interface NoteSectionProps {
  noteText: string;
  setNoteText: (v: string) => void;
  /** The text differs from the saved note, so Save shows. */
  changed: boolean;
  onSave: () => void;
}

/** The item's note, with Save once it has been changed. */
const NoteSection = ({
  noteText,
  setNoteText,
  changed,
  onSave,
}: NoteSectionProps) => (
  <div className={SECTION}>
    <div className="flex items-stretch bg-fill_soft border-b border-line_hair">
      <div className="px-3 py-1.5 text-[11px] cc-caps flex-1">Note</div>
      {changed && (
        <button
          onClick={onSave}
          className="px-3 text-[11px] font-medium text-brand_navy hover:underline"
        >
          Save
        </button>
      )}
    </div>
    <div className="p-3">
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="e.g. Labor day end cap"
        rows={2}
        className="basic-input bg-custom-white w-full py-1.5 px-2 text-[12px] resize-none"
        style={{ outline: "none", boxShadow: "none" }}
      />
    </div>
  </div>
);

export default NoteSection;
