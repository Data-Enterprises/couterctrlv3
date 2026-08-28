import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import CardSortToggle from "./CardSortToggle";
import DeviationCard from "./DeviationCard";
import CaseHeadline from "./CaseHeadline";
import { sortCards } from "./caseFileModel";
import type { CaseFile } from "./caseFileModel";

/**
 * The case, in one scroll: the verdict, then the cards, then the shape.
 *
 * There are no section headings between them on purpose. The cards state the
 * numbers and the charts show where those numbers fell — one claim made twice,
 * not two sections. Splitting them under headings made a reader hold a figure
 * in their head while they went looking for its shape.
 */
interface Props {
  file: CaseFile;
  /** The charts. Passed in rather than imported so this file stays about
   *  layout and the chart block can be built and tested on its own. */
  children?: React.ReactNode;
}

const CaseBreakdown = ({ file, children }: Props) => {
  const cardSort = useAppSelector((s) => s.lpActions.cardSort);

  const cards = useMemo(
    () => sortCards(file.cards, cardSort),
    [file.cards, cardSort],
  );

  return (
    <div className="h-full overflow-y-auto thin-scrollbar">
      <CaseHeadline headline={file.headline} />

      <div className="p-4">
        <div className="flex justify-end mb-2.5">
          <CardSortToggle />
        </div>

        <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(198px,1fr))]">
          {cards.map((card) => (
            <DeviationCard key={card.saleType} card={card} />
          ))}
        </div>

        {children}
      </div>
    </div>
  );
};

export default CaseBreakdown;
