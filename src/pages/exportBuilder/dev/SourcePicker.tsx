import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setSearchSource } from "../../../features/dev/devExportBuilderSlice";
import { SOURCES } from "./sources";

/**
 * Which table the search loads, on the search card above the store and dates.
 *
 * Above them because the preview it loads is per table, and the card is one
 * click away while configuring (Change, in the Configuration panel). Sales is
 * the default, so somebody who only exports sales sees one more row and
 * nothing else.
 *
 * One line per choice, the blurb beside the name rather than under it: the
 * card is centred, and two-line rows pushed its calendars off the bottom of
 * the window.
 */
const SourcePicker = () => {
  const dispatch = useAppDispatch();
  const picked = useAppSelector((s) => s.dev.exportBuilder.searchSource);
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-[12px] font-medium text-content mb-1.5">Data</legend>
      {SOURCES.map((source) => {
        const on = source.key === picked;
        return (
          <label
            key={source.key}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-colors ${
              on
                ? "bg-row_selected border-row_selected_border"
                : "border-brand_line hover:border-brand_slate"
            }`}
          >
            <input
              type="radio"
              name="export-source"
              checked={on}
              onChange={() => dispatch(setSearchSource(source.key))}
              className="accent-brand_navy h-3.5 w-3.5 flex-shrink-0"
            />
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="text-[12.5px] font-semibold text-content flex-shrink-0">
                {source.label}
              </span>
              <span className="text-[11px] text-content/85 truncate" title={source.blurb}>
                {source.blurb}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default SourcePicker;
