import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const ReceiverDetails = () => {
  const state = useAppSelector((state) => state.receivers);

  return (
    <div
      className={`${
        state.details.length === 0 && !state.isFetchingDetails ? "hidden" : ""
      } ${
        state.isFetchingDetails ? "bg-transparent" : "bg-custom-white shadow-lg"
      } rounded-lg full overflow-hidden h-[45vh] mt-4`}
    >
      <div className="relative w-full">
        {state.details.length > 0 && !state.isFetchingDetails ? (
          <div className="text-[13.5px]">
            <div className="w-full font-semibold border-content border-b-2 grid grid-cols-[4%_10%_25%_6%_7%_7%_7%_7%_8%_6%_6%_6%] bg-bkg">
              <div className="px-2 py-2">Line</div>
              <div className="px-2 py-2">UPC</div>
              <div className="px-2 py-2">Description</div>
              <div className="px-2 py-2">Cases</div>
              <div className="px-2 py-2">Units</div>
              <div className="px-2 py-2">U Cost</div>
              <div className="px-2 py-2">Ext Cost</div>
              <div className="px-2 py-2">Retail</div>
              <div className="px-2 py-2">Ext Retail</div>
              <div className="px-2 py-2">GM</div>
              <div className="px-2 py-2">Free</div>
              <div className="px-2 py-2">Return</div>
            </div>
            <div className="max-h-[39vh] overflow-y-auto no-scrollbar">
              {state.details.map((item, i) => (
                <div
                  key={i}
                  className="w-full mx-1 text-sm grid grid-cols-[4%_10%_25%_6%_7%_7%_7%_7%_8%_6%_6%_6%] hover:bg-gray-100 active:bg-gray-200"
                >
                  <div className="px-2 py-1.5 border-b border-gray-100">
                    {item.line_number}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100">
                    {item.product_code}
                  </div>
                  <div
                    className="px-2 py-1.5 border-b border-gray-100 truncate"
                    title={item.product_description}
                  >
                    {item.product_description}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {item.cases}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {item.units}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {formatCurrency2(item.ucost)}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {formatCurrency2(item.ext_cost)}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {formatCurrency2(item.retail)}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {formatCurrency2(item.ext_retail)}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {formatBigNumber(item.gm, 2)}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {item.free}
                  </div>
                  <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                    {item.return}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full h-12 bg-custom-white flex pr-3 border-t border-gray-200">
              {state.totals.map((item, i) => (
                <div
                  key={i}
                  className="w-full mx-1 text-sm grid grid-cols-[4%_10%_25%_6%_7%_7%_7%_7%_8%_6%_6%_7%] font-semibold"
                >
                  <div></div>
                  <div></div>
                  <div className="border-t-2 border-custom-white pr-2 mt-3 pt-1 text-right">
                    Totals:
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {item.cases}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {item.units}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {formatCurrency2(item.ucost)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {formatCurrency2(item.ext_cost)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {formatCurrency2(item.retail)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1 text-right">
                    {formatCurrency2(item.ext_retail)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1"></div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1"></div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1"></div>
                </div>
              ))}
            </div>
          </div>
        ) : state.isFetchingDetails ? (
          <div className="relative w-full h-full">
            <LoadingIndicator />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReceiverDetails;
