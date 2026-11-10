// Components
import BackLink from "./BackLink";
import FormError from "./FormError";
import StepTitle from "./StepTitle";
import SubmitButton from "./SubmitButton";
import TextField from "./TextField";

interface QuestionStepProps {
  question: string;
  answer: string;
  onAnswer: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

/** Step 2: the account's security question and its answer. */
const QuestionStep = ({ question, answer, onAnswer, busy, error, onSubmit, onBack }: QuestionStepProps) => (
  <form
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <StepTitle title="Answer your security question" />
    <div className="-mt-1.5 mb-4 bg-brand_paper border border-brand_line rounded-lg px-3.5 py-2.5">
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-brand_slate_2 mb-1">Your question</div>
      <div className="text-[14.5px] font-medium text-portal_navy leading-[1.45]">{question}</div>
    </div>
    <FormError message={error} />
    <TextField id="forgot-answer" label="Answer" value={answer} onChange={onAnswer} autoComplete="off" autoFocus disabled={busy} />
    <SubmitButton label="Continue" busyLabel="Checking…" busy={busy} />
    <BackLink label="Back" onClick={onBack} />
  </form>
);

export default QuestionStep;
