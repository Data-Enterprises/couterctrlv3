import UpcControls from "../components/UpcControls";

const SalesComp = () => {
  return (
    <div className="w-full grid grid-cols-[13%_87%] gap-4">
      <UpcControls />
      <div className="bg-custom-white p-4 mr-4 rounded-lg shadow-lg">test</div>
    </div>
  );
};

export default SalesComp;
