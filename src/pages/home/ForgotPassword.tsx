import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import type { Question } from "../../interfaces";
import { setForgotPassword } from "../../features/appSlice";
// import { getSecurityQuestions } from "../../api/security";
import Modal from "../../components/Modal";
import Carousel from "../../components/Carousel";
import SingleSelect from "../../components/SingleSelect";
import TextInput from "../../components/TextInput";

const dummyQuestions: Question[] = [
  { id: 1, question: "What is your mother's maiden name?" },
  { id: 2, question: "What was the name of your first pet?" },
  { id: 3, question: "What was the make of your first car?" },
];

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [height, setHeight] = useState<string>("h-[157px]");
  const [text, setText] = useState<string>("");

  useEffect(() => {
    // For now using dummy data
    setQuestions(dummyQuestions);
  }, []);

  useEffect(() => {
    if (index === 0) {
      setHeight("h-[157px]");
    } else if (index === 1) {
      setHeight("h-[190px]");
    } else if (index === 2) {
      setHeight("h-[169px]");
    }
  }, [index]);

  if (!context.showForgotPassword) {
    return null;
  }

  const handleChange = (id: string | number) => {
    console.log("Selected question ID:", id);
  };

  const handleNext = () => {
    setText("");
    setIndex((prevIndex) => prevIndex + 1);
  };

  const setPasswordText = (text: string) => {
    setText(text);
  };

  const onClose = () => {
    dispatch(setForgotPassword(false));
    setIndex(0);
    setText("");
  };

  return (
    <Modal
      modalClassName="ml-0 bg-bkg max-w-md w-full"
      isOpen={context.showForgotPassword}
      onClose={onClose}
    >
      <Carousel
        className={`bg-bkg ${height} transition-all duration-500`}
        showButtons={false}
        useDynamicIndex={true}
        dynamicIndex={index}
      >
        <div className="h-[157px] px-2">
          <div className="text-center font-medium">Verify Email</div>
          <div className="text-center mb-2">Please enter your valid username and email</div>
          <input
            type="text"
            className="basic-input focus:border bg-custom-white"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-themeBlue w-full mt-4" onClick={handleNext}>
            Verify
          </button>
        </div>
        <div className="h-[190px] px-2">
          <div className="font-medium text-center mb-4">
            Select your security question and provide your answer
          </div>
          <SingleSelect
            label=""
            data={questions}
            valueKey={"id"}
            displayKey="question"
            onSelect={handleChange}
          />
          <input
            type="text"
            className="basic-input focus:border bg-custom-white mt-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-themeBlue w-full mt-4" onClick={handleNext}>
            Submit Answer
          </button>
        </div>
        <div className="h-[169px] px-2">
          <div className="font-medium text-center">Reset Password</div>
          <div className="text-center">Once updated, sign in with your new password</div>
          <TextInput
            query={text}
            name="forgot-password"
            isSimple={true}
            type="password"
            title="Password"
            setText={setPasswordText}
          />
          <button className="btn-themeBlue w-full mt-4" onClick={() => {}}>
            Change Password
          </button>
        </div>
      </Carousel>
    </Modal>
  );
};

export default ForgotPassword;
