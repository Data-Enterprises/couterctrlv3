import axios from "axios";
import type { MarkdownType } from "../interfaces/markdowns";

export const getMarkdowns = async (
  url: string,
  token: string,
  startDate: string,
  endDate: string,
  searchValue: number,
  useGroups: number,
  page: number = 1,
  type: MarkdownType | null = null,
) => {
  const json = await axios({
    method: "POST",
    url: url + "markdowns",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      startDate,
      endDate,
      useGroups,
      searchValue,
      singleStore: useGroups ? 0 : 1,
      page,
      type,
    },
  });

  return json;
};
