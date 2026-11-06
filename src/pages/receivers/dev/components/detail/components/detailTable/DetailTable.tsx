// Hooks
import { useAppSelector } from "../../../../../../../hooks";

// Components
import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

const DetailTable = () => {
  const totals = useAppSelector((s) => s.dev.receivers.totals[0] ?? null);
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
