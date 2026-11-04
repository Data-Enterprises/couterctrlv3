import { useRef, type KeyboardEvent } from "react";
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
 *
 * It looks like the app's Checkbox, as asked, but it is one choice of four,
 * so underneath it is a radio group rather than four checkboxes: one Tab stop,
 * the arrow keys move the pick, and a screen reader announces "one of four".
 * The box and tick are drawn the way components-dev/Checkbox draws them.
 */
const SourcePicker = () => {
  const dispatch = useAppDispatch();
  const picked = useAppSelector((s) => s.dev.exportBuilder.searchSource);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);

  const pick = (index: number) => {
    const next = SOURCES[(index + SOURCES.length) % SOURCES.length];
    dispatch(setSearchSource(next.key));
    rows.current[SOURCES.indexOf(next)]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") pick(index + 1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") pick(index - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div role="radiogroup" aria-label="Data" className="flex flex-col gap-1.5">
      {SOURCES.map((source, i) => {
        const on = source.key === picked;
        return (
          <button
            key={source.key}
            ref={(el) => {
              rows.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            // The group is one stop: the pick is where Tab lands.
            tabIndex={on ? 0 : -1}
            onClick={() => dispatch(setSearchSource(source.key))}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`group w-full flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand_navy/40 ${
              on
                ? "bg-row_selected border-row_selected_border"
                : "border-brand_line hover:border-brand_slate"
            }`}
          >
            <span className="relative flex items-center justify-center flex-shrink-0">
              <span
                className={`w-[15px] h-[15px] rounded border transition-colors ${
                  on
                    ? "bg-brand_navy border-brand_navy"
                    : "bg-card_bg border-brand_line_2 group-hover:border-brand_slate"
                }`}
              />
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className={`absolute w-[11px] h-[11px] text-custom-white pointer-events-none transition-opacity ${
                  on ? "opacity-100" : "opacity-0"
                }`}
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="text-[12.5px] font-semibold text-content flex-shrink-0">
                {source.label}
              </span>
              <span className="text-[11px] text-content/85 truncate" title={source.blurb}>
                {source.blurb}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SourcePicker;
