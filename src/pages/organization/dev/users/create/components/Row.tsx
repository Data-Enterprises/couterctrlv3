// Components
import GrantModeChip from "./GrantModeChip";

/** One line of the review: a label, its value and an optional note. */
const Row = ({
  label,
  value,
  meta,
  mode,
}: {
  label?: string;
  value: string;
  meta?: string;
  mode?: "all" | "selected";
}) => (
  <div className="flex flex-wrap justify-between items-center gap-2 text-[12.5px] py-0.5">
    <span className="min-w-0">
      {label && <span className="text-content/85">{label} </span>}
      <span className="font-semibold text-content">{value}</span>
    </span>
    {(meta || mode) && (
      <span className="flex items-center gap-2 flex-shrink-0">
        {meta && <span className="text-[11.5px] text-content/85">{meta}</span>}
        {mode && <GrantModeChip mode={mode} />}
      </span>
    )}
  </div>
);

export default Row;
