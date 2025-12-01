import UpcControls from "../components/UpcControls";
import SalesComparison from "./salesComp/SalesComparison";
import SalesCompGrid from "./salesComp/SalesCompGrid";
import SalesCompHeader from "./salesComp/SalesCompHeader";

const SalesComp = () => {
  return (
    <div className="w-full grid grid-cols-[13%_87%] gap-4">
      <UpcControls />
      <div className="grid grid-rows-[19%_81%] gap-4 mr-4">
        <SalesCompHeader />

        {/* Table and comparison */}
        <div className="grid grid-cols-[80%_19%] gap-4 mb-4">
          <SalesCompGrid />
          <SalesComparison />
        </div>
      </div>
    </div>
  );
};

export default SalesComp;
