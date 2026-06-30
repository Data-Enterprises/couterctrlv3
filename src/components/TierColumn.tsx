import type { ReactNode } from "react";

interface TierColumnProps {
  children?: ReactNode;
  emptyText?: string;
}

const TierColumn = ({ children, emptyText = "None" }: TierColumnProps) => (
  <div className="overflow-y-auto thin-scrollbar flex-1 min-h-0">
    {children ?? (
      <div className="flex items-center justify-center py-8 text-[11px] text-content/25">
        {emptyText}
      </div>
    )}
  </div>
);

export default TierColumn;
