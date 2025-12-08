import axios from "axios";

export const getEmbedUrl = async (
  url: string,
  email: string,
  api_key: string
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: url + "quicksight/embed_url",
    params: {
      email,
      api_key,
    },
  });
  return json;
};
