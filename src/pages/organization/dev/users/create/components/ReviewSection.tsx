interface ReviewSectionProps {
  title: string;
  onEdit: () => void;
  empty: string | null;
  children?: React.ReactNode;
}

/** One titled block with its own way back to the step that set it. */
const ReviewSection = ({ title, onEdit, empty, children }: ReviewSectionProps) => (
  <div className="flex flex-wrap gap-x-8 gap-y-3 px-5 py-4 border-b border-line_hair">
    <div className="flex-1 min-w-[160px] max-w-[200px]">
      <h3 className="text-[12.5px] font-bold text-content m-0">{title}</h3>
      <button
        onClick={onEdit}
        className="text-[11.5px] font-semibold text-brand_navy hover:underline mt-0.5"
      >
        Edit
      </button>
    </div>
    <div className="flex-[999] min-w-[300px] flex flex-col gap-1.5">
      {empty ? (
        <span className="text-[12.5px] text-content/95">{empty}</span>
      ) : (
        children
      )}
    </div>
  </div>
);

export default ReviewSection;
