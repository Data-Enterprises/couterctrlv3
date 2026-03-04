const ItemsGridFilters = () => {
  return (
    <div className="bg-custom-white shadow-lg rounded-lg">
      <div className="bg-blue-500 text-custom-white font-medium px-2 py-0.5 rounded-t-lg">
        Item Filters
      </div>
      <div className="p-2 grid grid-rows-7 h-[94%] gap-3">
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Upc
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Description
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Sales
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Qty
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          COGS
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Margin
        </div>
        <div
          className={`py-2 flex justify-center items-center rounded-lg shadow-md hover:bg-blue-200 transition-all duration-200 cursor-pointer`}
        >
          Refresh
        </div>
      </div>
    </div>
  );
};

export default ItemsGridFilters;
