import axios from "axios";

export const login = async (
  url: string,
  username: string,
  password: string
) => {
  // endpoint is expecting username and password to be in the request body
  const json = await axios({
    method: "POST",
    url: url + "auth/login",
    data: {
      username,
      password,
    },
  });
  return json;
};
