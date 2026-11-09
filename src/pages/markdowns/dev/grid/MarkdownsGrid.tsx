// Hooks
import { useEffect, useMemo, useState } from "react";
import { useVisibleMarkdowns } from "../hooks";

// Utils
import { MARKDOWN_COLUMNS } from "../utils";
import { DEFAULT_PAGE_SIZE } from "./utils";

// Components
import GridNavyHeader from "./components/GridNavyHeader";
import GridHeader from "./components/GridHeader";
import GridRow from "./components/GridRow";
import GridPager from "./components/GridPager";

interface MarkdownsGridProps {
  onExport: () => void;
}

/** The right panel, as Receivers' detail panel draws its line items: navy
 *  header, the table of every markdown the filters keep, and a pager. */
const MarkdownsGrid = ({ onExport }: MarkdownsGridProps) => {
  const visible = useVisibleMarkdowns();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  // A filter that shortens the list can leave the page past its end.
  const safePage = Math.min(page, pageCount - 1);
  const paged = useMemo(
    () => visible.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [visible, safePage, pageSize],
  );

  // A new filter, sort or search starts from the first page.
  useEffect(() => setPage(0), [visible, pageSize]);

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white"
      style={{ flex: 1, minWidth: 0 }}
    >
      <GridNavyHeader shown={visible.length} onExport={onExport} />

      <div className="flex-1 overflow-auto thin-scrollbar">
        <table data-help="lines" className="w-full border-collapse text-[12px]">
          <GridHeader />
          <tbody className="divide-y divide-brand_navy/15 text-[13px]">
            {paged.map((row) => (
              <GridRow key={row.id} row={row} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={MARKDOWN_COLUMNS.length} className="px-3 py-6 text-[12px] text-content/95">
                  No markdowns match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <GridPager
        total={visible.length}
        page={safePage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
      />
    </div>
  );
};

export default MarkdownsGrid;
