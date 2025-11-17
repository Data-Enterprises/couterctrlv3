import axios from "axios";

export const forgotPWEmailVerify = async (
  url: string,
  username: string,
  email: string
) => {
  const json = await axios({
    method: "POST",
    url: url + "forgot_password/email_verification",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      username,
      email,
    },
  });
  return json;
};

export const resetForgotPassword = async (
  url: string,
  username: string,
  password: string
) => {
  const json = await axios({
    method: "PUT",
    url: url + "forgot_password/reset_password",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      username,
      password,
    },
  });
  return json;
};

export const validateSecurityAnswer = async (
  url: string,
  username: string,
  security_answer: string
) => {
  const json = await axios({
    method: "POST",
    url: url + "forgot_password/validate_answer",
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      username,
      security_answer,
    },
  });
  return json;
};
