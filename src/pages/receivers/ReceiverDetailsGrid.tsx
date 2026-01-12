import { useAppSelector, useAppDispatch } from "../../hooks";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { formatBigNumber, formatCurrency2 } from "../../utils";
import { useEffect, useRef, useState } from "react";
import { setIsExportModalOpen } from "../../features/receiversSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

import ExportModal from "./ExportModal";
import { detailCols } from ".";

const ReceiverDetailsGrid = () => {
  const dispatch = useAppDispatch();
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
  }, [topRef, bottomRef, state.details]);

  const openExportModal = () => {
    dispatch(setIsExportModalOpen(true));
  };

  return (
    <div
      className={`${
        state.details.length === 0 && !state.isFetchingDetails ? "hidden" : ""
      } bg-custom-white rounded-lg shadow-lg w-[99%] overflow-hidden`}
    >
      <ExportModal
        isOpen={state.isExportModalOpen}
        onClose={() => dispatch(setIsExportModalOpen(false))}
        data={state.details}
        columns={detailCols}
      />
      <div className="relative w-full h-full">
        {state.details.length ? (
          <div>
            <div
              ref={topRef}
              className="w-full mx-2 font-medium border-content border-b-2 grid grid-cols-[4%_10%_30%_6%_6%_6%_6%_6%_6%_6%_6%_6%]"
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
                  className="w-full mx-2 text-sm grid grid-cols-[4%_10%_30%_6%_6%_6%_6%_6%_6%_6%_6%_6%]"
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
              className="absolute bottom-0 w-full h-12 bg-custom-white flex"
            >
              {state.totals.map((item, i) => (
                <div
                  key={i}
                  className="w-full mx-2 text-sm grid grid-cols-[4%_10%_30%_6%_6%_6%_6%_6%_6%_6%_6%_7%] font-medium"
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
              <div className="absolute bottom-1.5 ml-2 bg-custom-white">
                <button
                  className="btn-themeBlue py-1"
                  onClick={openExportModal}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-content/70">
            Select a receiver to see details
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiverDetailsGrid;
