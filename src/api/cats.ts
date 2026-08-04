import axios from "axios";

export const getCatItems = async (
  url: string,
  token: string,
  category: number,
  startDate: string,
  endDate: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  page: number = 1,
  download: number = 0,
) => {
  const json = await axios({
    method: "POST",
    url: url + "categories/cats",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    data: {
      category: category,
      startDate: startDate,
      endDate: endDate,
      useGroups: useGroups,
      searchValue: searchValue,
      singleStore: singleStore,
      page: page,
      download: download,
    },
  });

  return json;
};
