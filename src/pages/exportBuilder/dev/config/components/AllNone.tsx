interface AllNoneProps {
  onAll: () => void;
  onNone: () => void;
}

/** all / none, for the lists that have too many rows to tick by hand. */
const AllNone = ({ onAll, onNone }: AllNoneProps) => (
  <div className="flex gap-3">
    <button
      type="button"
      onClick={onAll}
      className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
    >
      all
    </button>
    <button
      type="button"
      onClick={onNone}
      className="text-[11.5px] text-brand_navy_hover underline underline-offset-2"
    >
      none
    </button>
  </div>
);

export default AllNone;
