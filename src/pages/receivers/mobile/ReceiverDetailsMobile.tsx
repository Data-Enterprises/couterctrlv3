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
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto text-sm">
      <div className="grid grid-cols-2 gap-2 p-2">
        <button className="btn-themeBlue px-0" onClick={handleRefreshClick}>
          Refresh
        </button>
        <button className="btn-themeBlue px-0" onClick={handleReceiversClick}>
          Receivers
        </button>
      </div>
      <div className="font-medium px-2 underline">Totals</div>
      <div className="p-2 space-y-2">
        <div>
          <div className="bg-custom-white rounded-lg shadow-md p-2 grid grid-cols-3">
            <div className="col-span-3 flex justify-between pb-2">
              <div className="flex gap-1">
                <div>Receiver:</div>
                <div className="font-medium">{totals.cashier_name}</div>
              </div>
              <div className="flex gap-1">
                <div>Date:</div>
                <div className="font-medium">{state.detailsDate}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <div>Cases:</div>
              <div className="font-medium">
                {formatBigNumber(totals.cases, 0)}
              </div>
            </div>
            <div className="flex gap-1">
              <div>Units:</div>
              <div className="font-medium">
                {formatBigNumber(totals.units, 0)}
              </div>
            </div>
            <div className="flex gap-1">
              <div>U Cost:</div>
              <div className="font-medium">{formatCurrency2(totals.ucost)}</div>
            </div>
            <div className="flex gap-1">
              <div>E Cost:</div>
              <div className="font-medium">
                {formatCurrency2(totals.ext_cost)}
              </div>
            </div>
            <div className="flex gap-1">
              <div>Retail:</div>
              <div className="font-medium">
                {formatCurrency2(totals.retail)}
              </div>
            </div>
            <div className="flex gap-1">
              <div>E Retail:</div>
              <div className="font-medium">
                {formatCurrency2(totals.ext_retail)}
              </div>
            </div>
          </div>
        </div>
        <div className="font-medium underline">Details</div>
        <div className="space-y-2 min-h-[61vh] max-h-[61vh] overflow-y-auto">
          {details.map((d, i) => (
            <div
              key={i}
              className="bg-custom-white rounded-lg shadow-md p-2 grid grid-cols-3 text-[13.5px]"
            >
              <div className="col-span-3 flex justify-between mb-2">
                <div>{d.product_code}</div>
                <div>{d.product_description}</div>
              </div>
              <div className="flex gap-1">
                <div>Cases:</div>
                <div className="font-medium">{d.cases}</div>
              </div>
              <div className="flex gap-1">
                <div>Units:</div>
                <div className="font-medium">{d.units}</div>
              </div>
              <div className="flex gap-1">
                <div>U Cost:</div>
                <div className="font-medium">{formatCurrency2(d.ucost)}</div>
              </div>
              <div className="flex gap-1">
                <div>E. Cost:</div>
                <div className="font-medium">{formatCurrency2(d.ext_cost)}</div>
              </div>
              <div className="flex gap-1">
                <div>Retail:</div>
                <div className="font-medium">{formatCurrency2(d.retail)}</div>
              </div>
              <div className="flex gap-1">
                <div>E. Retail:</div>
                <div className="font-medium">
                  {formatCurrency2(d.ext_retail)}
                </div>
              </div>
              <div className="flex gap-1">
                <div>GM:</div>
                <div className="font-medium">{formatBigNumber(d.gm, 2)}</div>
              </div>
              <div className="flex gap-1">
                <div>Free:</div>
                <div className="font-medium">{formatBigNumber(d.free, 0)}</div>
              </div>
              <div className="flex gap-1">
                <div>Return:</div>
                <div className="font-medium">
                  {formatBigNumber(d.return, 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceiverDetailsMobile;
