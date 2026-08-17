import axios from "axios";

// for grabbing saved invoices
export const getInvoicesHistory = async (
  url: string,
  token: string,
  storeid: number,
  engine: string = "bedrock",
  status: string,
  limit: number = 50,
  offset: number = 0,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "invoices/history",
    params: {
      storeid: storeid,
      engine: engine,
      status: status,
      limit: limit,
      offset: offset,
    },
  });

  return json;
};

export const getInvoiceResult = async (
  url: string,
  token: string,
  run_id: string,
) => {
  const json = await axios({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + `invoices/result/${run_id}`,
  });

  return json;
};

// for posting invoices to the API
export const postBedrockInvoice = async (
  url: string,
  token: string,
  storeid: number,
  files: File[],
) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("storeid", storeid.toString());
  
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "invoices/parse_bedrock",
    data: form,
  });

  return json;
};

export const postTextractInvoice = async (
  url: string,
  token: string,
  storeid: number,
  files: File[],
) => {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("storeid", storeid.toString());

  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    url: url + "invoices/parse_textract",
    data: form,
  });

  return json;
};
