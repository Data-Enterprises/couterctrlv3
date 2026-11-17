interface DeletedQueryNoteProps {
  name: string;
  onUndo: () => void;
}

/** The short-lived offer to put a just-deleted saved query back. */
const DeletedQueryNote = ({ name, onUndo }: DeletedQueryNoteProps) => (
  <div className="bg-custom-white border-t border-brand_line px-3 py-2 flex items-center gap-3">
    <span className="text-[11.5px] text-content/95 flex-1">
      Deleted "{name}".
    </span>
    <button
      type="button"
      onClick={onUndo}
      className="text-[11.5px] font-semibold text-brand_navy_hover underline underline-offset-2"
    >
      Put it back
    </button>
  </div>
);

export default DeletedQueryNote;
