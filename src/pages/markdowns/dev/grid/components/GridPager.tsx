// Utils
import { PAGE_SIZES } from "../utils";

// Components
import PagerButton from "../../../../../components-dev/PagerButton";

interface GridPagerProps {
  /** Rows the filters keep. */
  total: number;
  /** The page shown, from 0. */
  page: number;
  pageCount: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

/** The pager under the grid, as Orders' report panel has it. */
const GridPager = ({ total, page, pageCount, pageSize, onPage, onPageSize }: GridPagerProps) => (
  <div className="flex items-center gap-3 border-t border-gray-100 px-3 py-1.5 flex-shrink-0">
    <span className="text-[11px] text-content/95">
      {total === 0
        ? "No rows"
        : `${(page * pageSize + 1).toLocaleString()}–${Math.min(
            (page + 1) * pageSize,
            total,
          ).toLocaleString()} of ${total.toLocaleString()}`}
    </span>

    <label className="flex items-center gap-1.5 text-[11px] text-content/95">
      Rows
      <select
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
        className="rounded border border-content/20 bg-custom-white px-1.5 py-0.5 text-[11px] text-content"
        style={{ outline: "none" }}
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>

    <div className="flex-1" />

    <div className="flex items-center gap-1">
      <PagerButton label="First" disabled={page === 0} onClick={() => onPage(0)} />
      <PagerButton label="Prev" disabled={page === 0} onClick={() => onPage(page - 1)} />
      <span className="px-1.5 text-[11px] font-medium text-content tabular-nums">
        {page + 1} / {pageCount}
      </span>
      <PagerButton label="Next" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)} />
      <PagerButton label="Last" disabled={page >= pageCount - 1} onClick={() => onPage(pageCount - 1)} />
    </div>
  </div>
);

export default GridPager;
