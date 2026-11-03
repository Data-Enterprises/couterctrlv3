import type { ReactNode } from "react";
import { CARD, CARD_TITLE } from "./recapGrid";

/** One block inside an open day: a titled card on brand_paper. */
const RecapCard = ({
  title,
  children,
  className = "",
  compact = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  /** Tighter padding, for a short panel. */
  compact?: boolean;
}) => (
  <section
    aria-label={title}
    className={`${CARD} h-full min-w-0 px-4 ${compact ? "py-2" : "py-3"} ${className}`}
  >
    <div className={CARD_TITLE}>{title}</div>
    {children}
  </section>
);

export default RecapCard;
