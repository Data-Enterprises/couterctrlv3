interface DownloadsHeaderProps {
  /** How long the listing's links last. */
  expireMinutes: number;
  loading: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

/** The Previous builds title line: how long the links last, Refresh, Close. */
const DownloadsHeader = ({
  expireMinutes,
  loading,
  onRefresh,
  onClose,
}: DownloadsHeaderProps) => (
  <div className="flex items-baseline gap-3 flex-shrink-0">
    <h2 className="text-[15px] font-semibold">Previous builds</h2>
    <span className="text-[11.5px] text-content/95">
      yours, newest first · links last {expireMinutes} min from this listing
    </span>
    <div className="flex-1" />
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors disabled:opacity-40"
    >
      {loading ? "Reading..." : "Refresh"}
    </button>
    <button
      type="button"
      onClick={onClose}
      className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-brand_navy hover:bg-brand_navy_hover text-custom-white transition-colors"
    >
      Close
    </button>
  </div>
);

export default DownloadsHeader;
