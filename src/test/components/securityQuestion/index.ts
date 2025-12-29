export const JsonErrorResp = new Error("API request failed");
export const defaultSuccessResp = {
  data: { error: 0, success: true, msg: "Success" },
};

export const questionsWarnResp = {
  data: {
    error: 1
  }
}

export const questionsSuccessResp = {
  data: {
    error: 0,
    success: true,
    msg: "Success",
    questions: [
      {
        id: 1,
        question: "Whats your pets name?",
      },
      {
        id: 2,
        question: "What is your favorite model car?",
      },
      {
        id: 3,
        question: "What is your favorite food?",
      },
      {
        id: 4,
        question: "Where did you attend high school?",
      },
      {
        id: 5,
        question: "Whats is your mothers maiden name?",
      },
    ],
  },
};
