/** One line of the working popover: a key and its value, bold or dimmed. */
const Row = ({
  k,
  v,
  strong,
  soft,
}: {
  k: string;
  v: string;
  strong?: boolean;
  soft?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-6 px-3 py-1.5">
    <span
      className={`text-[12px] ${strong ? "font-semibold text-content" : soft ? "text-content/95" : "text-content"}`}
    >
      {k}
    </span>
    <span
      className={`text-[12px] tabular-nums ${
        strong ? "font-bold text-brand_navy text-[13px]" : "text-content"
      }`}
    >
      {v}
    </span>
  </div>
);

export default Row;
