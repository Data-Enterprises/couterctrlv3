import axios from "axios";

export const getSecurityQuestions = async (url: string, token: string) => {
  const json = await axios({
    method: "GET",
    url: url + "auth/security_questions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return json;
};

export const setSecurityQuestionAnswer = async (
  url: string,
  token: string,
  userid: number,
  security_question_id: number,
  security_answer: string
) => {
  const json = await axios({
    method: "PUT",
    url: url + "auth/update_user_security_question_answer",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      userid,
      security_question_id,
      security_answer,
    },
  });
  return json;
};
