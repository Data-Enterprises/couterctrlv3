import type { ReactNode } from "react";
import { CARD, CARD_TITLE } from "./recapGrid";

/** One block inside an open day: a titled card on brand_paper. */
const RecapCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <section aria-label={title} className={`${CARD} px-4 py-3 ${className}`}>
    <div className={CARD_TITLE}>{title}</div>
    {children}
  </section>
);

export default RecapCard;
