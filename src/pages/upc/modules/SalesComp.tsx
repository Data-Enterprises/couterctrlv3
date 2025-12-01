import UpcControls from "../components/UpcControls";
import SalesComparison from "./salesComp/SalesComparison";
import SalesCompGrid from "./salesComp/SalesCompGrid";
import SalesCompHeader from "./salesComp/SalesCompHeader";
import { useRowHeight } from "../../hooks";

const SalesComp = () => {
  const { rows } = useRowHeight();

  return (
    <div className="h-full w-full grid grid-cols-[13%_87%] gap-4">
      <UpcControls />
      <div className={`w-full h-full grid ${rows} gap-4`}>
        <SalesCompHeader />
        <div className="grid grid-cols-[80%_19%] gap-4 mb-4">
          <SalesCompGrid />
          <SalesComparison />
        </div>
      </div>
    </div>
  );
};

export default SalesComp;
