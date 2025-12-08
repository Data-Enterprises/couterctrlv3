import axios from "axios";

export const getEmbedUrl = async (
  url: string,
  token: string,
  email: string
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "quicksight/embed_url",
    params: {
      email,
    },
  });
  return json;
};
