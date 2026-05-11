import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setAnswer, setIndex } from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import { validateSecurityAnswer } from "../../../api/password";
import Input from "../../../components/inputs/Input";

const SecurityAnswer = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const forgot = useAppSelector((state) => state.forgotPassword);

  const verifySecurityAnswer = () => {
    validateSecurityAnswer(context.url, forgot.username, forgot.answer)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(j.msg);
          dispatch(setIndex());
        } else {
          toast.warn("Error processing request");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div data-testid="security-answer-forgot" className={`${forgot.index !== 1 && "opacity-0 transition-all duration-400"}`}>
      <div className="text-sm text-center font-medium">
        <div>Security Question</div>
        <div>{forgot.question}</div>
      </div>
      <Input
        label="Answer"
        value={forgot.answer}
        setValue={(text) => dispatch(setAnswer(text))}
        className="py-1.5"
        onKeyDown={verifySecurityAnswer}
      />
      <button
        data-testid="submit-security-answer-button-forgot"
        className="btn-themeBlue w-full mt-4"
        onClick={verifySecurityAnswer}
      >
        Submit Answer
      </button>
    </div>
  );
};

export default SecurityAnswer;
