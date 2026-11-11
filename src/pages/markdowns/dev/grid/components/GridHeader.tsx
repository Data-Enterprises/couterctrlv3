// Hooks
import { useMarkdownsCtx } from "../../hooks";

// Redux
import { toggleMarkdownSort } from "../../../../../features/dev/devMarkdownsSlice";

// Utils
import { GRID_COLUMNS } from "../../utils";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";

/** The grid's sticky header row, styled as Receivers' table. Each heading
 *  sorts its column: descending, ascending, then the backend's order. */
const GridHeader = () => {
  const { sort, dispatch } = useMarkdownsCtx();
  return (
    <thead>
      <tr className="sticky top-0 bg-fill_soft border-b border-line_hair z-10">
        {GRID_COLUMNS.map((c) => {
          const on = sort?.col === c.key;
          const Arrow =
            on && sort.dir === "asc" ? ChevronUpIcon : ChevronDownIcon;
          return (
            <th
              key={c.key}
              scope="col"
              aria-sort={
                on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
              }
              className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95 whitespace-nowrap ${
                c.align === "right" ? "text-right" : "text-left"
              }`}
            >
              <button
                type="button"
                onClick={() => dispatch(toggleMarkdownSort(c.key))}
                className={`inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-brand_navy ${
                  c.align === "right" ? "flex-row-reverse" : ""
                }`}
              >
                {c.label}
                <Arrow
                  className={`w-3 h-3 ${on ? "text-brand_navy" : "invisible"}`}
                />
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default GridHeader;
