// Hooks
import { useMemo } from "react";

// Redux
import {
  setSelectedColumns,
  toggleColumn,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { isPii } from "../../utils/piiColumns";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import AllNone from "./AllNone";
import ConfigRow from "./ConfigRow";
import ListSearch from "./ListSearch";

interface ColumnsSectionProps {
  /** The file is a summary, whose columns are its keys and measures. */
  aggregating: boolean;
  columns: ExportCtx["columns"];
  columnOrder: ExportCtx["columnOrder"];
  selectedColumns: ExportCtx["selectedColumns"];
  columnQuery: string;
  onColumnQuery: (value: string) => void;
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Columns row: every column in the preview's order, ticked in or out,
 *  with a search and the personal columns as one switch. */
const ColumnsSection = ({
  aggregating,
  columns,
  columnOrder,
  selectedColumns,
  columnQuery,
  onColumnQuery,
  dispatch,
  isOpen,
  onToggle,
}: ColumnsSectionProps) => {
  const shown = useMemo(() => {
    const q = columnQuery.trim().toLowerCase();
    return columnOrder
      .map((name) => columns.find((c) => c.name === name))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .filter((c) => c.name.toLowerCase().includes(q));
  }, [columnOrder, columns, columnQuery]);

  /** The personal columns, on or off together: eight of the 102 are customer
   *  identity, and hunting them out one at a time is how half of them end up
   *  in the file by accident. */
  const piiNames = columns.map((c) => c.name).filter(isPii);
  const piiOn = piiNames.some((n) => selectedColumns.includes(n));
  const togglePii = (on: boolean) =>
    dispatch(
      setSelectedColumns(
        on
          ? [...new Set([...selectedColumns, ...piiNames])]
          : selectedColumns.filter((n) => !isPii(n)),
      ),
    );

  return (
    <ConfigRow
      label="Columns"
      isOpen={isOpen}
      onToggle={onToggle}
      summary={
        aggregating
          ? "not in this file"
          : selectedColumns.length === columns.length
            ? `all ${columns.length}`
            : `${selectedColumns.length} of ${columns.length}`
      }
    >
      <div className="px-3 pb-3 flex flex-col gap-2">
        {aggregating && (
          <span className="text-[11.5px] text-severity_watch_text bg-severity_watch_bg border border-severity_watch_text/20 rounded px-2 py-1.5">
            This file is a summary, so its columns are the keys and the
            measures. Clear those to go back to exporting the lines.
          </span>
        )}
        <AllNone
          onAll={() => dispatch(setSelectedColumns(columns.map((c) => c.name)))}
          onNone={() => dispatch(setSelectedColumns([]))}
        />
        {piiNames.length > 0 && (
          <div
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border ${
              piiOn
                ? "bg-severity_watch_bg border-severity_watch_text/20"
                : "bg-custom-white border-brand_line"
            }`}
          >
            <Checkbox
              checked={piiOn}
              onChange={togglePii}
              className="text-[12px] flex-1"
              label={
                <span className="flex items-center gap-1.5">
                  Personal columns
                  <span className="text-[11px] text-content/95">
                    {piiNames.filter((n) => selectedColumns.includes(n)).length}{" "}
                    of {piiNames.length}
                  </span>
                </span>
              }
            />
            {piiOn && (
              <span className="text-[9.5px] font-semibold tracking-wide text-severity_watch_text">
                IN THE FILE
              </span>
            )}
          </div>
        )}
        <ListSearch
          label="Find a column..."
          value={columnQuery}
          onChange={onColumnQuery}
          shown={shown.length}
          total={columns.length}
        />
        <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
          {shown.map((c) => (
            <Checkbox
              key={c.name}
              checked={selectedColumns.includes(c.name)}
              onChange={() => dispatch(toggleColumn(c.name))}
              className={`w-full py-1.5 px-1 text-[12.5px] border-b border-brand_line last:border-0 ${
                isPii(c.name) ? "bg-severity_watch_bg" : ""
              }`}
              label={
                <span className="flex items-center gap-2 w-full min-w-0">
                  <span className="font-mono text-[11.5px] flex-1 truncate">
                    {c.name}
                  </span>
                  {isPii(c.name) && (
                    <span className="text-[9.5px] font-semibold tracking-wide text-severity_watch_text">
                      PERSONAL
                    </span>
                  )}
                  <span className="text-[10.5px] text-content/95">
                    {c.data_type}
                  </span>
                </span>
              }
            />
          ))}
          {shown.length === 0 && (
            <span className="text-[12px] text-content/95 py-2">
              No column matches that.
            </span>
          )}
        </div>
      </div>
    </ConfigRow>
  );
};

export default ColumnsSection;
