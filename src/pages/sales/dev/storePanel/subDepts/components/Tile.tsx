// Interfaces
import type { Gate } from "../../../utils/deptReport";

// Components
import Mark from "./Mark";

interface TileProps {
  gate: Gate;
}

/**
 * One gate, as a tile.
 *
 * Run together on one line the three checks read as a sentence about a
 * sentence. Three tiles put the question above the figure and let the
 * failing one carry the tint, so what was checked and what it found are
 * read at a glance rather than parsed.
 */
const Tile = ({ gate }: TileProps) => {
  const fail = gate.state === "fail";
  const skipped = gate.state === "skipped";
  return (
    <div
      className={`flex items-center gap-2.5 min-w-0 rounded-md px-3 py-1.5 ${
        fail
          ? "bg-delta_negative_bg"
          : skipped
            ? "bg-custom-white border border-brand_navy/15"
            : "bg-delta_positive_bg"
      }`}
    >
      <Mark state={gate.state} />
      <span className="min-w-0">
        <span
          className={`block text-[10px] font-bold uppercase tracking-wide leading-tight ${
            fail
              ? "text-delta_negative_text"
              : skipped
                ? "text-content/95"
                : "text-delta_positive_text"
          }`}
        >
          {gate.label}
        </span>
        <span
          className={`block text-[12.5px] font-semibold tabular-nums truncate leading-tight mt-0.5 ${
            fail
              ? "text-delta_negative_text"
              : skipped
                ? "text-content/95"
                : "text-delta_positive_text"
          }`}
        >
          {gate.value}
        </span>
      </span>
    </div>
  );
};

export default Tile;
