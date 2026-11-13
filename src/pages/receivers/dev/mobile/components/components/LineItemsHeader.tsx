// Utils
import { lineItemHeaders, LINE_GRID } from "../utils";

/** The column headings above the phone receiver's line items. */
const LineItemsHeader = () => {
  return (
    <div
      className="grid px-3 py-1.5 bg-fill_soft border-b border-line_hair"
      style={{ gridTemplateColumns: LINE_GRID }}
    >
      {lineItemHeaders.map((h, i) => (
        <div
          key={h}
          className={`text-[10px] cc-caps ${i > 0 ? "text-right" : ""}`}
        >
          {h}
        </div>
      ))}
    </div>
  );
};

export default LineItemsHeader;
