// Interfaces
import type { ReactNode } from "react";

/** A question and its answer. Reading, not a control -- the report at the
 *  bottom is the only thing in the rail that goes anywhere. */
const QuestionSection = ({
  question,
  answer,
  sub,
  figure,
}: {
  question: string;
  answer: ReactNode;
  sub: ReactNode;
  figure?: ReactNode;
}) => (
  <div className="py-2.5 border-b border-gray-100 last:border-b-0">
    <div className="text-[13px] text-content/85">{question}</div>
    <div className="flex items-center gap-2 mt-0.5">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-bold text-content leading-snug">
          {answer}
        </div>
        <div className="text-[13px] text-content/85 leading-snug mt-0.5">
          {sub}
        </div>
      </div>
      {figure && <div className="flex-shrink-0">{figure}</div>}
    </div>
  </div>
);

export default QuestionSection;
