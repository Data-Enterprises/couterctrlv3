import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
const ReceiverDetailsMobile = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.receivers);
  const details = state.details;
  const totals = state.totals[0];

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto text-sm">
      <div className="grid grid-cols-2 gap-2 p-2">
        <button className="btn-themeBlue px-0">Refresh</button>
        <button className="btn-themeBlue px-0">Receivers</button>
      </div>
      <div className="p-2 space-y-2">
        <div>
          {/* <div>{details[0].}</div> */}
          <div className="bg-custom-white rounded-lg shadow-md p-2 grid grid-cols-2">
            <div className="flex gap-1">
              <div>Receiver:</div>
              <div className="font-medium">{totals.cashier_name}</div>
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
              <div>Unit Cost:</div>
              <div className="font-medium">{formatCurrency2(totals.ucost)}</div>
            </div>
            <div className="flex gap-1">
              <div>Ext Cost:</div>
              <div className="font-medium">
                {formatCurrency2(totals.ext_cost)}
              </div>
            </div>
            <div className="flex gap-1">
              <div>Ext Retail:</div>
              <div className="font-medium">
                {formatCurrency2(totals.ext_retail)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-md p-2">Details</div>
      </div>
    </div>
  );
};

export default ReceiverDetailsMobile;
