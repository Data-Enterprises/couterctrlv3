import { ArrowPathIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";
import { reQuery, setRecMobileStage } from "../../../features/receiversSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
const ReceiverDetailsMobile = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);
  const details = state.details;
  const totals = state.totals[0];

  const handleRefreshClick = () => {
    dispatch(reQuery());
  };

  const handleReceiversClick = () => {
    dispatch(setRecMobileStage(2));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] text-[12px] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="grid grid-cols-2">
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2 border-r border-content/15"
          onClick={handleRefreshClick}
        >
          <ArrowPathIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/60">Refresh</div>
        </div>
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2"
          onClick={handleReceiversClick}
        >
          <DocumentCheckIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/60">Received</div>
        </div>
      </div>
      <div className="p-2 space-y-2">
        <div>
          <div className="bg-custom-white rounded-lg shadow-md px-2 pt-1 pb-1.5">
            <div className="flex justify-between">
              <div className="font-medium">{totals.cashier_name}</div>
              <div className="font-medium">{state.detailsDate}</div>
            </div>
            <div className="col-span-3 grid grid-cols-2 h-[1.5px] mb-1.5">
              <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
              <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">Cases:</div>
                <div className="font-medium">
                  {formatBigNumber(totals.cases, 0)}
                </div>
              </div>
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">Units:</div>
                <div className="font-medium">
                  {formatBigNumber(totals.units, 0)}
                </div>
              </div>
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">U Cost:</div>
                <div className="font-medium">
                  {formatCurrency2(totals.ucost)}
                </div>
              </div>
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">E Cost:</div>
                <div className="font-medium">
                  {formatCurrency2(totals.ext_cost)}
                </div>
              </div>
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">Retail:</div>
                <div className="font-medium">
                  {formatCurrency2(totals.retail)}
                </div>
              </div>
              <div className="bg-slate-100 py-1 px-2 rounded-md shadow-md flex justify-between">
                <div className="text-content/60">E Retail:</div>
                <div className="font-medium">
                  {formatCurrency2(totals.ext_retail)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-2 pt-1 pb-2 bg-custom-white rounded-lg shadow-lg text-[12px]">
          <div className="font-medium">Items</div>
          <div className="grid grid-cols-2 h-[1.5px] mb-1.5">
            <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
            <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
          </div>
          <div className="space-y-2 min-h-[62.5vh] max-h-[62.5vh] overflow-y-auto text-[11px]">
            {details.map((d, i) => (
              <div key={i} className="bg-blue-200/50 rounded-md shadow-md px-2 pt-1 pb-2">
                <div className="flex justify-between font-medium">
                  <div>{d.product_code}</div>
                  <div>{d.product_description}</div>
                </div>
                <div className="grid grid-cols-2 h-[1.5px] mb-1.5">
                  <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
                  <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">Cases:</div>
                    <div className="">{d.cases}</div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">Units:</div>
                    <div className="">{d.units}</div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">U Cost:</div>
                    <div className="">
                      {formatCurrency2(d.ucost)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">E. Cost:</div>
                    <div className="">
                      {formatCurrency2(d.ext_cost)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">Retail:</div>
                    <div className="">
                      {formatCurrency2(d.retail)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">E. Retail:</div>
                    <div className="">
                      {formatCurrency2(d.ext_retail)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">GM:</div>
                    <div className="">
                      {formatBigNumber(d.gm, 2)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">Free:</div>
                    <div className="">
                      {formatBigNumber(d.free, 0)}
                    </div>
                  </div>
                  <div className="flex justify-between bg-custom-white rounded-md shadow py-1 px-2">
                    <div className="text-content/60">Return:</div>
                    <div className="">
                      {formatBigNumber(d.return, 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiverDetailsMobile;
