// Redux
import {
  removeComputed,
  setComputedAlias,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { sketchExpr } from "../../utils/query/sketchExpr";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import TextField from "../../../../../components-dev/inputs/TextField";

interface ComputedMeasureRowProps {
  measure: ExportCtx["computed"][number];
  /** Its place in the list, which the slice's actions address it by. */
  at: number;
  dispatch: AppDispatch;
}

/** One computed aggregate from the query box: its expression, a remove
 *  button, and what it is called in the file. */
const ComputedMeasureRow = ({
  measure: m,
  at,
  dispatch,
}: ComputedMeasureRowProps) => (
  <div className="flex flex-col gap-1 border border-brand_line_2 rounded-lg p-2 bg-filter_active">
    <div className="flex items-center gap-1.5">
      <span className="flex-1 min-w-0 font-mono text-[11px] text-content/95 truncate">
        {sketchExpr(m.expr)}
      </span>
      <span className="text-[9.5px] font-semibold tracking-wide text-content/95">
        COMPUTED
      </span>
      <button
        type="button"
        onClick={() => dispatch(removeComputed(at))}
        aria-label={`Remove ${m.alias}`}
        className="w-[22px] h-[22px] flex-shrink-0 rounded border border-brand_line_2 cc-muted-link hover:border-brand_slate"
      >
        ×
      </button>
    </div>
    <TextField
      label={
        <span className="text-[11px] font-normal text-content/95">
          Called in the file
        </span>
      }
      value={m.alias}
      onChange={(value) =>
        dispatch(setComputedAlias({ at, alias: value.trim() }))
      }
    />
  </div>
);

export default ComputedMeasureRow;
