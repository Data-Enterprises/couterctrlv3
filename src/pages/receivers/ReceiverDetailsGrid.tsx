import { useAppSelector } from "../../hooks";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { formatBigNumber, formatCurrency2 } from "../../utils";
import { useEffect, useRef, useState } from "react";
ModuleRegistry.registerModules([AllCommunityModule]);

import LoadingIndicator from "../../components/loading/LoadingIndicator";

const ReceiverDetailsGrid = () => {
  const state = useAppSelector((state) => state.receivers);
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const calculateHeight = () => {
      const top = topRef.current?.getBoundingClientRect().bottom || 0;
      const bottom = bottomRef.current?.getBoundingClientRect().top || 0;
      const availableHeight = bottom - top;
      setHeight(availableHeight);
    };
    calculateHeight();
  }, [topRef, bottomRef, state.details, state.isFetchingDetails]);

  return (
    <div
      className={`${
        state.details.length === 0 && !state.isFetchingDetails ? "hidden" : ""
      } ${
        state.isFetchingDetails ? "bg-transparent" : "bg-custom-white shadow-lg"
      } rounded-lg w-[99%] overflow-hidden pr-4`}
    >
      <div className="relative w-full h-full p-4">
        {state.details.length > 0 && !state.isFetchingDetails ? (
          <div>
            <div
              ref={topRef}
              className="w-full mx-2 font-medium border-content border-b-2 grid grid-cols-[4%_10%_28%_6%_6%_6%_6%_6%_8%_6%_6%_6%]"
            >
              <div>Line</div>
              <div>UPC</div>
              <div>Description</div>
              <div className="pl-2">Cases</div>
              <div className="pl-2">Units</div>
              <div className="pl-2">U Cost</div>
              <div className="pl-2">Ext Cost</div>
              <div className="pl-2">Retail</div>
              <div className="pl-2">Ext Retail</div>
              <div className="pl-2">GM</div>
              <div className="pl-2">Free</div>
              <div className="pl-2">Return</div>
            </div>
            <div
              style={{ maxHeight: height }}
              className="overflow-y-scroll no-scrollbar"
            >
              {state.details.map((item, i) => (
                <div
                  key={i}
                  className="w-full mx-2 text-sm grid grid-cols-[4%_10%_28%_6%_6%_6%_6%_6%_8%_6%_6%_6%]"
                >
                  <div>{item.line_number}</div>
                  <div>{item.product_code}</div>
                  <div>{item.product_description}</div>
                  <div className="pl-2">{item.cases}</div>
                  <div className="pl-2">{item.units}</div>
                  <div className="pl-2">{formatCurrency2(item.ucost)}</div>
                  <div className="pl-2">{formatCurrency2(item.ext_cost)}</div>
                  <div className="pl-2">{formatCurrency2(item.retail)}</div>
                  <div className="pl-2">{formatCurrency2(item.ext_retail)}</div>
                  <div className="pl-2">{formatBigNumber(item.gm)}</div>
                  <div className="pl-2">{item.free}</div>
                  <div className="pl-2">{item.return}</div>
                </div>
              ))}
            </div>
            <div
              ref={bottomRef}
              className="absolute bottom-0 w-full h-12 bg-custom-white flex pr-3"
            >
              {state.totals.map((item, i) => (
                <div
                  key={i}
                  className="w-full mx-2 text-sm grid grid-cols-[4%_10%_28%_6%_6%_6%_6%_6%_8%_6%_6%_7%] font-medium"
                >
                  <div></div>
                  <div></div>
                  <div className="border-t-2 border-custom-white pr-2 mt-3 pt-1 text-right">
                    Totals:
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
                    {item.cases}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
                    {item.units}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
                    {formatCurrency2(item.ucost)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
                    {formatCurrency2(item.ext_cost)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
                    {formatCurrency2(item.retail)}
                  </div>
                  <div className="border-content border-t-2 pl-2 mt-3 pt-1">
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

export default ReceiverDetailsGrid;
