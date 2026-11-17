// Interfaces
import type { SavedConfig } from "../../../../../api/savedConfigs";

// Components
import TextField from "../../../../../components-dev/inputs/TextField";

interface SaveCurrentCardProps {
  /** What the configuration on screen holds, in a line. */
  summary: string;
  name: string;
  setName: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  busy: boolean;
  /** The saved export that is loaded, if any, which Update replaces. */
  current: SavedConfig | undefined;
  onSave: () => void;
  onUpdate: (current: SavedConfig) => void;
}

/** Saving the configuration on screen, which is the reason most people open
 *  Saved exports: a name, a description, Save, and Update for the loaded one. */
const SaveCurrentCard = ({
  summary,
  name,
  setName,
  note,
  setNote,
  busy,
  current,
  onSave,
  onUpdate,
}: SaveCurrentCardProps) => (
  <div className="flex-shrink-0 border border-brand_line rounded-lg p-3 bg-custom-white flex flex-col gap-2">
    <div className="text-[12.5px] font-semibold">
      Save the configuration on screen
    </div>
    <div className="text-[11.5px] text-content/95">{summary}</div>
    <div className="flex items-end gap-2">
      <TextField
        label="Name"
        value={name}
        placeholder="Shrink by vendor"
        onChange={setName}
        className="w-[200px]"
      />
      <TextField
        label={
          <span className="text-[11px] font-normal text-content/95">
            Description
          </span>
        }
        value={note}
        placeholder="What it answers"
        onChange={setNote}
        className="flex-1 min-w-0"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={!name.trim() || busy}
        className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Save
      </button>
      {current && (
        <button
          type="button"
          onClick={() => onUpdate(current)}
          disabled={busy}
          title={`Replace "${current.name}" with what is on screen`}
          className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
        >
          Update "{current.name}"
        </button>
      )}
    </div>
  </div>
);

export default SaveCurrentCard;
