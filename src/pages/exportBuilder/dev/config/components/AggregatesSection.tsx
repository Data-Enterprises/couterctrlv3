// Redux
import {
  addAggregate,
  setAggregate,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { fnsFor } from "../../utils/aggregates";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { SelectFilterOption } from "../../../../../components-dev/filters/interfaces";
import type { ExportCtx } from "../interfaces";

// Components
import ComputedMeasureRow from "./ComputedMeasureRow";
import ConfigRow from "./ConfigRow";
import MeasureRow from "./MeasureRow";

interface AggregatesSectionProps {
  aggregates: ExportCtx["aggregates"];
  computed: ExportCtx["computed"];
  /** How many aggregates the file has, plain and computed. */
  measureCount: number;
  columns: ExportCtx["columns"];
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Aggregates row: each aggregate with its column, function and name in
 *  the file, the computed ones from the query box, and a way to add one. */
const AggregatesSection = ({
  aggregates,
  computed,
  measureCount,
  columns,
  dispatch,
  isOpen,
  onToggle,
}: AggregatesSectionProps) => {
  /**
   * A measure's column changed, so its function may no longer be legal: sum and
   * avg exist only for numeric columns, and the endpoint rejects the pair.
   * Moving to the nearest allowed function keeps a row from sitting invalid.
   */
  const changeMeasureColumn = (at: number, column: string) => {
    const allowed = fnsFor(column, columns);
    const current = aggregates[at]?.fn;
    dispatch(
      setAggregate({
        at,
        measure: {
          column,
          fn: current && allowed.includes(current) ? current : allowed[0],
        },
      }),
    );
  };

  const measureColumns: SelectFilterOption[] = [
    { value: "*", label: "All rows (count)" },
    ...columns.map((c) => ({ value: c.name, label: c.name })),
  ];

  return (
    <ConfigRow
      label="Aggregates"
      isOpen={isOpen}
      onToggle={onToggle}
      summary={
        measureCount === 0
          ? "none yet"
          : `${measureCount} aggregate${measureCount === 1 ? "" : "s"}`
      }
    >
      <div className="px-3 pb-3 flex flex-col gap-2">
        <span className="text-[11px] text-content/95">
          What to work out for each row. The name in the file carries the
          operation, so nothing reads as something it is not.
        </span>
        {aggregates.map((m, i) => (
          <MeasureRow
            key={`${m.column}-${m.fn}-${i}`}
            measure={m}
            at={i}
            columns={columns}
            measureColumns={measureColumns}
            onColumn={(value) => changeMeasureColumn(i, value)}
            dispatch={dispatch}
          />
        ))}

        {/* Computed measures come from the query box: a column and a function
            cannot say `sum(qty) * max(price)`. Shown and removable here because
            this is where someone looks for what the file holds. */}
        {computed.map((m, i) => (
          <ComputedMeasureRow
            key={`computed-${i}`}
            measure={m}
            at={i}
            dispatch={dispatch}
          />
        ))}
        <button
          type="button"
          onClick={() => dispatch(addAggregate({ column: "*", fn: "count" }))}
          className="text-[11.5px] text-brand_navy_hover underline underline-offset-2 self-start"
        >
          add an aggregate
        </button>
        {measureCount === 0 && (
          <span className="text-[11.5px] text-content/95">
            A summary with no aggregates is just the list of groups. Arithmetic
            between them comes from the query box.
          </span>
        )}
      </div>
    </ConfigRow>
  );
};

export default AggregatesSection;
