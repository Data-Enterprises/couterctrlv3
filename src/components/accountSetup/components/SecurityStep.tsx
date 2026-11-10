// Utils
import { FIELD, LABEL } from "../utils";

// Interfaces
import type { Question } from "../../../interfaces";

// Components
import SetupField from "./SetupField";

interface SecurityStepProps {
  questions: Question[];
  failed: boolean;
  questionId: number;
  onQuestion: (id: number) => void;
  answer: string;
  onAnswer: (value: string) => void;
}

/** A security question from the list, and its answer. */
const SecurityStep = ({ questions, failed, questionId, onQuestion, answer, onAnswer }: SecurityStepProps) => (
  <div className="space-y-3 mb-4">
    {failed && (
      <p
        role="alert"
        className="text-[12.5px] leading-[1.5] text-brand_danger bg-brand_danger_bg border border-brand_danger_line rounded-lg px-3 py-2"
      >
        The security questions couldn't be loaded. Sign out and sign in again to retry.
      </p>
    )}
    <div>
      <label htmlFor="setup-question" className={LABEL}>
        Question
      </label>
      <select
        id="setup-question"
        data-testid="setup-question"
        value={questionId}
        onChange={(e) => onQuestion(Number(e.target.value))}
        className={`${FIELD} cursor-pointer`}
      >
        <option value={0} disabled>
          {questions.length ? "Pick a question" : "Loading questions…"}
        </option>
        {questions.map((q) => (
          <option key={q.id} value={q.id}>
            {q.question}
          </option>
        ))}
      </select>
    </div>
    <SetupField id="setup-answer" label="Answer" value={answer} onChange={onAnswer} autoComplete="off" />
  </div>
);

export default SecurityStep;
