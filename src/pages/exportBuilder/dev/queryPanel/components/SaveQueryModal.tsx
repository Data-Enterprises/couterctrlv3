// Hooks
import { useState } from "react";

// Components
import Modal from "../../../../../components-dev/Modal";
import TextField from "../../../../../components-dev/inputs/TextField";

interface SaveQueryModalProps {
  /** Rename changes the open row's name and description; new is a new row. */
  mode: "new" | "rename";
  /** The open query's name, for the Rename title. */
  currentName: string | null;
  initialName: string;
  initialNote: string;
  onCancel: () => void;
  onSave: (name: string, note: string) => void;
}

/** The name-and-description box for Save as new and Rename. Its own fields
 *  start from the values it opens with, since it closes after each use. */
const SaveQueryModal = ({
  mode,
  currentName,
  initialName,
  initialNote,
  onCancel,
  onSave,
}: SaveQueryModalProps) => {
  const [name, setName] = useState<string>(initialName);
  const [note, setNote] = useState<string>(initialNote);

  return (
    <Modal
      isOpen
      onClose={onCancel}
      modalClassName="bg-card_bg w-[520px] max-w-[92vw]"
    >
      <div className="flex flex-col gap-3 p-4">
        <h2 className="text-[15px] font-semibold">
          {mode === "rename" && currentName
            ? `Rename "${currentName}"`
            : "Save this query"}
        </h2>
        <TextField
          label="Name"
          value={name}
          placeholder="Loss and gain by vendor"
          onChange={setName}
        />
        <TextField
          label="Description"
          value={note}
          placeholder="What it answers"
          onChange={setNote}
        />
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(name, note)}
            disabled={!name.trim()}
            className="bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12.5px] font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            {mode === "rename" ? "Rename" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveQueryModal;
