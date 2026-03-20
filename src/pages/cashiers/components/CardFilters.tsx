

const CardFilters = () => {

  return (
    <div className="relative bg-custom-white p-2 rounded-lg shadow-lg flex flex-col gap-2">
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Store Name
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Total Sales
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Total Qty
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Total Transactions
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Risk Level
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Exception Tier
      </button>
      <button className="py-2 shadow-md rounded-lg hover:bg-orange-200 transition-all duration-200">
        Refresh
      </button>
    </div>
  );
};

export default CardFilters;