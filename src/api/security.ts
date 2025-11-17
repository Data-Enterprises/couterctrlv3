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
