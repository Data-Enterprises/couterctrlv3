// Hooks
import { useReceiversState } from "../../../../hooks";

// Components
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

/** The scrollable line-item table of a receiver: header, rows, and a totals footer once totals exist. */
const DetailTable = () => {
  const totals = useReceiversState().totals[0] ?? null;
  return (
    <div className="flex-1 overflow-auto thin-scrollbar">
      <table data-help="lines" className="w-full border-collapse text-[12px]">
        <Header />
        <Body />
        {totals && <Footer />}
      </table>
    </div>
  );
};

export default DetailTable;
