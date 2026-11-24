// Components
import StorePicker from "../../../../../components-dev/storePicker/StorePicker";
import DatePickers from "../../../../../components-dev/datePickers/DatePickers";

interface CpnEntryCardProps {
  /** The last search came back empty. */
  noCouponsFound: boolean;
  loading: boolean;
  /** Nothing is picked yet, so the button asks for a pick. */
  nothingPicked: boolean;
  pickLabel: string;
  onSearch: () => void;
}

/** The phone's search card: store or group, dates, and Load Coupons. */
const CpnEntryCard = ({
  noCouponsFound,
  loading,
  nothingPicked,
  pickLabel,
  onSearch,
}: CpnEntryCardProps) => (
  <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-bkg">
    <div className="mx-4 pt-4 pb-2">
      <div className="bg-custom-white rounded-2xl shadow-lg p-4 flex flex-col gap-3">
        <div>
          <div className="text-[15px] font-bold text-content">Coupons</div>
          <div className="text-[10px] text-content/95 mt-1">
            Select a store or group and date range to load coupon activity.
          </div>
        </div>
        {noCouponsFound && (
          <div className="cc-notice text-[11.5px] leading-snug">
            No coupons came back for this search.
          </div>
        )}
        <StorePicker />
        <DatePickers showBtn={false} handleQuery={onSearch} />
        <button
          onClick={onSearch}
          disabled={loading || nothingPicked}
          className="w-full py-2.5 text-[12px] font-semibold text-custom-white rounded-xl bg-brand_navy hover:bg-brand_navy_hover disabled:opacity-60 transition-colors"
        >
          {loading ? "Loading…" : nothingPicked ? pickLabel : "Load Coupons"}
        </button>
      </div>
    </div>
  </div>
);

export default CpnEntryCard;
