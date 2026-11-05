// Utils
import { COLUMNS, tintOf } from "../utils/columns";

// Interfaces
import type { ItemVerdict } from "../interfaces";

/** The totals row, over every filtered item. */
const GridFoot = ({
  shown,
  fmt,
}: {
  shown: ItemVerdict[];
  fmt: (v: number) => string;
}) => {
  /* Sticky to the bottom of the scroller, so the totals are
     readable from the first row as well as the last. Over the
     whole filtered set rather than this page: a total of fifty
     rows is not a total of anything anybody asked about. */
  return (
    <tfoot>
      <tr>
        <td className="sticky bottom-0 left-0 z-30 bg-bkg border-t-2 border-t-brand_line_2 border-r border-brand_line px-2 py-1.5" />
        {COLUMNS.map((c) => (
          <td
            key={c.key}
            className={`sticky bottom-0 z-20 border-t-2 border-t-brand_line_2 border-r border-brand_line px-2.5 py-1.5 font-bold whitespace-nowrap ${
              c.right ? "text-right" : ""
            } ${tintOf(c) || "bg-bkg"}`}
          >
            {c.foot ? c.foot(shown, fmt) : null}
          </td>
        ))}
      </tr>
    </tfoot>
  );
};

export default GridFoot;
