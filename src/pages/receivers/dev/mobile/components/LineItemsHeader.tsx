// Utils
import { lineItemHeaders } from "./utils";

const LineItemsHeader = () => {
  return (
    <div
      className="grid px-3 py-1.5 bg-gray-50 border-b border-gray-100"
      style={{ gridTemplateColumns: "1fr 38px 38px 50px 34px" }}
    >
      {lineItemHeaders.map((h, i) => (
        <div
          key={h}
          className={`text-[10px] font-semibold uppercase tracking-wide text-content/95 ${i > 0 ? "text-right" : ""}`}
        >
          {h}
        </div>
      ))}
    </div>
  );
};

export default LineItemsHeader;
