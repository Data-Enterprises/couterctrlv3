interface SavedExportsHeaderProps {
  onClose: () => void;
}

/** The Saved exports title row, with Close. */
const SavedExportsHeader = ({ onClose }: SavedExportsHeaderProps) => (
  <div className="flex items-baseline gap-3 flex-shrink-0">
    <h2 className="text-[15px] font-semibold">Saved exports</h2>
    <span className="text-[11.5px] text-content/95">
      yours, on any machine · a build made from one carries its name
    </span>
    <div className="flex-1" />
    <button
      type="button"
      onClick={onClose}
      className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-brand_navy hover:bg-brand_navy_hover text-custom-white transition-colors"
    >
      Close
    </button>
  </div>
);

export default SavedExportsHeader;
