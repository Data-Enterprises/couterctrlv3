// Hooks
import { useMemo } from "react";

// Redux
import {
  setGroupBy,
  toggleGroupBy,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { isPii } from "../../utils/piiColumns";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import ConfigRow from "./ConfigRow";
import ListSearch from "./ListSearch";

interface GroupBySectionProps {
  groupBy: ExportCtx["groupBy"];
  /** How many aggregates the file has, plain and computed. */
  measureCount: number;
  columns: ExportCtx["columns"];
  groupQuery: string;
  onGroupQuery: (value: string) => void;
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Group By row: the keys in the order they were ticked, and every column
 *  to pick a key from. Warns when there are aggregates and no key. */
const GroupBySection = ({
  groupBy,
  measureCount,
  columns,
  groupQuery,
  onGroupQuery,
  dispatch,
  isOpen,
  onToggle,
}: GroupBySectionProps) => {
  /**
   * Measures, and nothing to group them by: a summary with no keys has no rows
   * to put the numbers in. The endpoint refuses it, so the row points at the
   * fix rather than greying a button and waiting.
   */
  const needsKey = measureCount > 0 && groupBy.length === 0;

  const shownGroupColumns = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    return columns.filter((c) => c.name.toLowerCase().includes(q));
  }, [columns, groupQuery]);

  return (
    <ConfigRow
      label="Group By"
      warn={needsKey}
      isOpen={isOpen}
      onToggle={onToggle}
      summary={
        groupBy.length > 0
          ? `${groupBy.length} key${groupBy.length === 1 ? "" : "s"}`
          : measureCount > 0
            ? "needed for aggregates"
            : "nothing yet"
      }
    >
      <div className="px-3 pb-3 flex flex-col gap-1.5">
        <span className="text-[11px] text-content/95">
          One row per combination of these, in the order you tick them. Ticking
          one makes the file a summary.
        </span>
        {groupBy.length === 0 && measureCount > 0 && (
          <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
            There are measures but nothing to group them by, so the export has
            nothing to put in a row. Pick a key — storeid for one row per store,
            product_code for one per item.
          </span>
        )}
        {groupBy.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {groupBy.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => dispatch(toggleGroupBy(name))}
                title="Remove this key"
                className="font-mono text-[10.5px] bg-filter_active border border-brand_line_2 rounded px-1.5 py-0.5"
              >
                {i + 1}. {name} ×
              </button>
            ))}
            <button
              type="button"
              onClick={() => dispatch(setGroupBy([]))}
              className="text-[11px] text-brand_navy_hover underline underline-offset-2 px-1"
            >
              clear
            </button>
          </div>
        )}
        <ListSearch
          label="Find a column..."
          value={groupQuery}
          onChange={onGroupQuery}
          shown={shownGroupColumns.length}
          total={columns.length}
        />
        <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
          {shownGroupColumns.map((c) => (
            <Checkbox
              key={c.name}
              checked={groupBy.includes(c.name)}
              onChange={() => dispatch(toggleGroupBy(c.name))}
              className={`w-full py-1.5 px-1 text-[12.5px] border-b border-brand_line last:border-0 ${
                isPii(c.name) ? "bg-severity_watch_bg" : ""
              }`}
              label={
                <span className="flex items-center gap-2 w-full min-w-0">
                  <span className="font-mono text-[11.5px] flex-1 truncate">
                    {c.name}
                  </span>
                  <span className="text-[10.5px] text-content/95">
                    {c.data_type}
                  </span>
                </span>
              }
            />
          ))}
        </div>
      </div>
    </ConfigRow>
  );
};

export default GroupBySection;
