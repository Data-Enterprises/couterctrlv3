import type { ComponentType, ReactNode, SVGProps } from "react";
import { CARD, CARD_BAR, CARD_TITLE } from "./recapGrid";

/**
 * One block of a day's recap: a card with a titled bar across its top.
 *
 * The bar (a tint of the page ground, with an outline icon) is what gives each
 * block its own edge on the tray behind them, so four blocks of figures read
 * as four things rather than one flat sheet. `bodyClassName` lets a block lay
 * out its own body (the chart wants it full-bleed).
 */
const RecapCard = ({
  title,
  icon: Icon,
  children,
  className = "",
  bodyClassName = "px-4 py-3",
  compact = false,
}: {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** A tighter bar and body, for a short panel. */
  compact?: boolean;
}) => (
  <section
    aria-label={title}
    className={`${CARD} h-full min-w-0 flex flex-col overflow-hidden ${className}`}
  >
    <div className={`${CARD_BAR} ${compact ? "py-1.5" : "py-2"}`}>
      <Icon className="h-4 w-4 flex-none text-brand_navy" aria-hidden="true" />
      <h4 className={CARD_TITLE}>{title}</h4>
    </div>
    <div className={`flex-1 min-h-0 ${compact ? bodyClassName.replace("py-3", "py-2") : bodyClassName}`}>
      {children}
    </div>
  </section>
);

export default RecapCard;
