// Redux
import {
  setFlag,
  setOrderBy,
  setRowFlag,
  toggleSortKey,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import {
  choiceToFlag,
  FILE_FORMATS,
  flagChoices,
  flagToChoice,
  PREFIX_OK,
} from "../utils";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import TextField from "../../../../../components-dev/inputs/TextField";
import ConfigRow from "./ConfigRow";

interface OutputSectionProps {
  flags: ExportCtx["flags"];
  dateFormats: ExportCtx["dateFormats"];
  /** The file name box, which settles into the store a beat later. */
  fileName: string;
  onFileName: (value: string) => void;
  source: ExportCtx["source"];
  rowFlags: ExportCtx["rowFlags"];
  orderBy: ExportCtx["orderBy"];
  sortableKeys: ExportCtx["sortableKeys"];
  aggregating: boolean;
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Output row, the export endpoint's switches rather than the preview's
 *  data: format, date style, file name, the source's line flags, and the sort. */
const OutputSection = ({
  flags,
  dateFormats,
  fileName,
  onFileName,
  source,
  rowFlags,
  orderBy,
  sortableKeys,
  aggregating,
  dispatch,
  isOpen,
  onToggle,
}: OutputSectionProps) => (
  <ConfigRow
    label="Output"
    isOpen={isOpen}
    onToggle={onToggle}
    summary={flags.fileFormat.toUpperCase()}
  >
    <div className="px-3 pb-3 flex flex-col gap-2.5">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-content">Format</span>
        <SelectFilter
          plain
          options={FILE_FORMATS}
          value={flags.fileFormat}
          onChange={(value) => dispatch(setFlag({ fileFormat: value }))}
          className="w-full"
        />
      </label>
      {dateFormats.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-content">Dates</span>
          <SelectFilter
            plain
            options={dateFormats.map((f) => ({
              value: f.value,
              label: `${f.label} — ${f.example}`,
            }))}
            value={flags.dateFormat}
            onChange={(value) => dispatch(setFlag({ dateFormat: value }))}
            className="w-full"
          />
          <span className="text-[11px] text-content/95">
            How the file spells its date columns. The preview above shows them
            as the table stores them. Sorting stays chronological whichever is
            picked.
          </span>
        </label>
      )}
      <TextField
        label="File name"
        value={fileName}
        placeholder={source.filePrefix}
        hint={
          fileName && !PREFIX_OK.test(fileName) ? (
            <span className="text-severity_watch_text">
              Letters, digits, - and _ only, up to 60. It names the build's
              folder, so a dot is refused rather than cleaned up.
            </span>
          ) : (
            `${fileName || source.filePrefix}.${
              flags.fileFormat === "csv" ? "csv" : "txt"
            }`
          )
        }
        onChange={onFileName}
      />
      {source.flags.map((flag) => (
        <label key={flag.filter} className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-content">
            {flag.label}
          </span>
          <SelectFilter
            plain
            options={flagChoices(flag)}
            value={flagToChoice(rowFlags[flag.filter] ?? null)}
            onChange={(value) =>
              dispatch(
                setRowFlag({ filter: flag.filter, value: choiceToFlag(value) }),
              )
            }
            className="w-full"
          />
        </label>
      ))}
      {/* The sort is the file's own columns, in the order they are clicked:
          ascending, descending, gone. Sorting by something the file does not
          carry is a question about rows nobody can see. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-medium text-content flex-1">
            Sort by
          </span>
          {orderBy.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(setOrderBy([]))}
              className="text-[11px] text-brand_navy_hover underline underline-offset-2"
            >
              clear
            </button>
          )}
        </div>
        {orderBy.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {orderBy.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => dispatch(toggleSortKey(s.key))}
                title="Click to turn it around, again to remove it"
                className="font-mono text-[10.5px] bg-filter_active border border-brand_line_2 rounded px-1.5 py-0.5"
              >
                {i + 1}. {s.key} {s.desc ? "↓" : "↑"}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1 max-h-[18vh] overflow-y-auto thin-scrollbar">
          {sortableKeys
            .filter((key) => !orderBy.some((s) => s.key === key))
            .map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => dispatch(toggleSortKey(key))}
                className="font-mono text-[10.5px] bg-card_bg border border-brand_line rounded px-1.5 py-0.5 hover:border-brand_slate transition-colors"
              >
                + {key}
              </button>
            ))}
        </div>
        <span className="text-[11px] text-content/95">
          {orderBy.length === 0
            ? "Unsorted unless the switch below is on. Sorting a long file takes longer to build."
            : "Click a key to turn it around, again to drop it."}
        </span>
      </div>
      <Checkbox
        checked={flags.ordered}
        onChange={(value) => dispatch(setFlag({ ordered: value }))}
        disabled={orderBy.length > 0}
        className="text-[12.5px]"
        label={
          <span className="flex items-center gap-2">
            Sort the file
            <span className="text-[11px] text-content/95">
              {orderBy.length > 0
                ? "the keys above win"
                : aggregating
                  ? "by its group keys · slower"
                  : "by store, date and line · slower"}
            </span>
          </span>
        }
      />
    </div>
  </ConfigRow>
);

export default OutputSection;
