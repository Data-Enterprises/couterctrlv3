import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, Question } from "../../interfaces";

import {
  getSecurityQuestions,
  setSecurityQuestionAnswer,
} from "../../api/security";

import Modal from "../../components/Modal";
import TextInput from "../../components/TextInput";
import SingleSelect from "../../components/SingleSelect";
import { setSecurityQuestionId } from "../../features/userSlice";

const SecurityQuestion = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const user = useAppSelector((state) => state.user);
  const [answer, setAnswer] = useState<string>("");
  const [securityQuestions, setSecurityQuestions] = useState<Question[]>([]);
  const [questionId, setQuestionId] = useState<number>(0);

  useEffect(() => {
    if (user.securityQuestionId === 0) {
      getSecurityQuestions(context.url, context.token)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            setSecurityQuestions(j.questions);
            toast.info(
              "Please set your security question and answer to secure your account."
            );
          } else {
            toast.warn("No security questions available at this time.");
          }
        })
        .catch((err: JsonError) => {
          toast.error("Error getting security questions: " + err.message);
        });
    }
  }, []);

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
  };

  const handleQuestionSelection = (id: number | string) => {
    setQuestionId(id as number);
  };

  const submitAnswer = () => {
    if (!questionId && !answer.trim()) {
      toast.warn("Please select a security question and provide an answer.");
      return;
    }
    if (questionId === 0) {
      toast.warn("Please select a security question.");
      return;
    }
    if (!answer.trim()) {
      toast.warn("Please provide an answer to the selected security question.");
      return;
    }
    setSecurityQuestionAnswer(
      context.url,
      context.token,
      user.userid,
      questionId,
      answer
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSecurityQuestionId(questionId));
          toast.success("Security question and answer set successfully.");
        } else {
          toast.warn("Failed to set security question and answer.");
        }
      })
      .catch((err: JsonError) => {
        toast.error(
          "Error setting security question and answer: " + err.message
        );
      });
  };

  // Return nothing if user already has a security question set
  if (user.securityQuestionId > 0) {
    return null;
  }

  // Else we show the modal to set security question and answer
  return (
    <Modal isOpen={user.securityQuestionId === 0}>
      <div className="text-center font-medium">
        Welcome to CounterCtrl {user.firstName} {user.lastName}!
      </div>
      <div className="text-center text-sm">
        Since this is your first time signing in, please select a security
        question and answer that will be used in case you need to update your
        password
      </div>
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
          <button
            data-testid="submit-security-answer"
            className="btn-themeBlue w-full"
            onClick={submitAnswer}
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SecurityQuestion;
