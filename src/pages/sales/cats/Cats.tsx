import { useAppSelector } from "../../../hooks";
import { useHeight } from "../../hooks";
import CatCard from "./CatCard";

const Cats = () => {
  const sales = useAppSelector((state) => state.sales);
  const { topRef, bottomRef, height } = useHeight();

  return (
    <div
      className={`w-full h-[95%] bg-custom-white rounded-lg`}
      ref={topRef}
    >
      <div
        ref={bottomRef}
        className="bg-blue-500 text-custom-white flex justify-between py-0.5 px-4 font-medium rounded-t-lg"
      >
        <div>Category Sales</div>
      </div>
      <div
        className={`grid grid-cols-2 no-scrollbar overflow-y-scroll p-2 gap-2`}
        style={{ height: height, maxHeight: height }}
      >
        {sales.catSales.map((cat, i) => (
          <CatCard key={i} cat={cat} />
        ))}
      </div>
    </div>
  );
};

export default Cats;
