import Modal from "../../components/Modal";
import { useAppSelector } from "../../hooks";
import SingleSelect from "../../components/SingleSelect";
import TextInput from "../../components/TextInput";
import { useState, useEffect } from "react";
import { getSecurityQuestions } from "../../api/security";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

type Question = {
  id: number;
  question: string;
};

const SecurityQuestion = () => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const [answer, setAnswer] = useState<string>("");
  const [securityQuestions, setSecurityQuestions] = useState<Question[]>([]);
  const [questionId, setQuestionId] = useState<number>(0);

  useEffect(() => {
    if (!context.token) return;
    getSecurityQuestions(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setSecurityQuestions(j.questions);
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting security questions: " + err.message);
      });
  }, []);

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
  };

  if (user.securityQuestionId !== 0) {
    return null;
  }

  const handleQuestionSelection = (id: number | string) => {
    setQuestionId(id as number);
  };

  const submitAnswer = () => {
    console.log("Submitting answer:", questionId, answer);
  };

  return (
    <Modal isOpen={true} onClose={() => {}}>
      <div className="space-y-4">
        <SingleSelect
          label="Question"
          data={securityQuestions}
          valueKey={"id"}
          displayKey={"question"}
          onSelect={handleQuestionSelection}
        />
        <TextInput
          title="Answer"
          query={answer}
          setText={handleAnswerChange}
          name="Answer"
          isSimple={true}
        />
        <div className="mt-4 flex">
          <button className="btn-themeBlue w-full" onClick={submitAnswer}>
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SecurityQuestion;
