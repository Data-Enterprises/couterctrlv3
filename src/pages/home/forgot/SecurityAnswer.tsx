import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setAnswer, setIndex } from "../../../features/forgotPasswordSlice";
import type { JsonError } from "../../../interfaces";
import TextInput from "../../../components/TextInput";
import { validateSecurityAnswer } from "../../../api/password";

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
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div data-testid="security-answer-forgot" className="h-[190px] px-2">
      <div className="font-medium text-center mb-2">
        Provide your Security Answer
      </div>
      <div className="text-center mb-2">{forgot.question}</div>
      <TextInput
        query={forgot.answer}
        isSimple={true}
        title="Answer"
        name="forgot-question-answer"
        setText={(text) => dispatch(setAnswer(text))}
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
