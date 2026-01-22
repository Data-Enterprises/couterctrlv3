import NivoPie from "../graphs/NivoPie";

const KpiHeader = () => {

  return (
    <div className="grid grid-cols-5 gap-4">
      <NivoPie valueKey="total_sales" />
      <NivoPie valueKey="qty" />
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Top Sub
      </div>
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Top Item
      </div>
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Top Cat?
      </div>
    </div>
  );
};

export default KpiHeader;