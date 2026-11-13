// Utils
import { SHEET_COLS } from "../utils";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareSheetHeadProps {
  names: [string, string];
}

/** The two lists named once over their columns, each underlined in its colour. */
const CompareSheetHead = ({ names }: CompareSheetHeadProps) => (
  <div className={`${SHEET_COLS} px-2`}>
    <span />
    <span className="col-span-2 flex items-center justify-end gap-1.5 pb-1.5 border-b-2 border-brand_navy min-w-0">
      <ListBadge side="A" />
      <span className="truncate text-[13px] font-bold text-content">{names[0]}</span>
    </span>
    <span className="col-span-2 flex items-center justify-end gap-1.5 pb-1.5 border-b-2 border-compare_b min-w-0">
      <ListBadge side="B" />
      <span className="truncate text-[13px] font-bold text-content">{names[1]}</span>
    </span>
    <span />
  </div>
);

export default CompareSheetHead;
