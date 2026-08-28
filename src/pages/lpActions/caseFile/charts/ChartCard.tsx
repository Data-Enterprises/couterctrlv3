/**
 * The frame around one chart: a title, a caption saying what the axis is, and
 * a horizontally scrolling well so a wide chart never makes the panel itself
 * scroll sideways.
 */
interface Props {
  title: string;
  caption: string;
  /** Shown instead of the chart while the read it depends on is in flight. */
  loading?: boolean;
  /** Shown when the read finished and there was nothing to draw. */
  empty?: string;
  children: React.ReactNode;
}

const ChartCard = ({ title, caption, loading, empty, children }: Props) => (
  <div className="rounded-lg border border-gray-200 p-3">
    <div className="text-[11.5px] font-semibold text-content">{title}</div>
    <div className="text-[10.5px] text-content/85 mb-2">{caption}</div>

    {loading ? (
      <div className="h-[140px] flex items-center justify-center text-[11px] text-content/85">
        Reading receipts…
      </div>
    ) : empty ? (
      <div className="h-[140px] flex items-center justify-center text-[11px] text-content/85">
        {empty}
      </div>
    ) : (
      <div className="overflow-x-auto thin-scrollbar">{children}</div>
    )}
  </div>
);

export default ChartCard;
