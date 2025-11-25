import { useAppSelector } from "../../../hooks";
const Cats = () => {
  const sales = useAppSelector((state) => state.sales);

  return (
    <div
      className={`w-full h-full bg-custom-white rounded-lg shadow-lg  ${
        sales.windowVisible.cats ? "" : "hidden"
      }`}
    >
      <div
        // ref={bottomRef}
        className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg"
      >
        <div>Category Sales</div>
      </div>
    </div>
  );
};

export default Cats;
