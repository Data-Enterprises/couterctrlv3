// Redux
import {
  removeAggregate,
  setAggregate,
  setAggregateAlias,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { aliasFor, fnsFor, FN_LABELS } from "../../utils/aggregates";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { SelectFilterOption } from "../../../../../components-dev/filters/interfaces";
import type { ExportCtx } from "../interfaces";

// Components
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import TextField from "../../../../../components-dev/inputs/TextField";

interface MeasureRowProps {
  measure: ExportCtx["aggregates"][number];
  /** Its place in the list, which the slice's actions address it by. */
  at: number;
  columns: ExportCtx["columns"];
  /** Every column, plus "all rows" for a count. */
  measureColumns: SelectFilterOption[];
  onColumn: (column: string) => void;
  dispatch: AppDispatch;
}

/** One aggregate: its column, its function, a remove button, and what it is
 *  called in the file. */
const MeasureRow = ({
  measure: m,
  at,
  columns,
  measureColumns,
  onColumn,
  dispatch,
}: MeasureRowProps) => (
  <div className="flex flex-col gap-1 border border-brand_line rounded-lg p-2 bg-custom-white">
    <div className="flex items-center gap-1.5">
      <SelectFilter
        plain
        searchable
        searchPlaceholder="Find a column..."
        options={measureColumns}
        value={m.column}
        onChange={onColumn}
        className="flex-1 min-w-0"
      />
      <SelectFilter
        plain
        options={fnsFor(m.column, columns).map((fn) => ({
          value: fn,
          label: FN_LABELS[fn],
        }))}
        value={m.fn}
        onChange={(value) =>
          dispatch(
            setAggregate({
              at,
              measure: { column: m.column, fn: value as typeof m.fn },
            }),
          )
        }
        className="w-[130px] flex-shrink-0"
      />
      <button
        type="button"
        onClick={() => dispatch(removeAggregate(at))}
        aria-label={`Remove ${aliasFor(m.column, m.fn)}`}
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
      value={m.alias ?? ""}
      placeholder={aliasFor(m.column, m.fn)}
      onChange={(value) =>
        dispatch(setAggregateAlias({ at, alias: value.trim() }))
      }
    />
  </div>
);

export default MeasureRow;
