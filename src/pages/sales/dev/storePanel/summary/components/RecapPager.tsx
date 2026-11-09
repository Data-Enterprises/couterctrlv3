// Utils
import { PAGE_SIZES } from "../utils/recapItemPaging";

// Components
import PagerButton from "./PagerButton";

/**
 * The item view's pager, laid out as the Orders report's: the range shown,
 * rows per page, then First, Prev, page of pages, Next and Last.
 */
const RecapPager = ({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  /** 0-based. */
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex-none flex items-center gap-3.5 px-[18px] py-1.5 border-t border-brand_line text-[12px] text-content">
      <span className="tabular-nums">
        {total === 0
          ? "No items"
          : `${(page * pageSize + 1).toLocaleString()}–${Math.min(
              (page + 1) * pageSize,
              total,
            ).toLocaleString()} of ${total.toLocaleString()}`}
      </span>
      <label className="flex items-center gap-1.5">
        Rows
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded border border-content/20 bg-custom-white pl-2 pr-7 py-0.5 text-[12px] text-content"
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
        <span className="px-1.5 font-semibold tabular-nums">
          {page + 1} / {pages}
        </span>
        <PagerButton label="Next" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} />
        <PagerButton label="Last" disabled={page >= pages - 1} onClick={() => onPage(pages - 1)} />
      </div>
    </div>
  );
};

export default RecapPager;
