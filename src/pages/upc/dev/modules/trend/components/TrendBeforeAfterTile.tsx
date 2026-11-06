interface Props {
  label: string;
  before: string;
  after: string;
}

// Plain before/after tile for metrics with no natural ceiling (Total units,
// Volatility, Slope), labelled in words.
const TrendBeforeAfterTile = ({ label, before, after }: Props) => {
  return (
    <div className="text-center bg-gray-200/60 rounded py-2 px-1.5">
      <div className="text-[12px] text-content/85 mb-1">{label}</div>
      <div className="text-[12.5px]">
        Before <span className="font-medium">{before}</span>
      </div>
      <div className="text-[12.5px]">
        After <span className="font-medium">{after}</span>
      </div>
    </div>
  );
};

export default TrendBeforeAfterTile;
