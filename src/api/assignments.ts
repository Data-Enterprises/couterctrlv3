import axios from "axios";

export const shareBgWithUsers = async (
  url: string,
  token: string,
  company: number,
  base_group: number,
  userids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "assignments/share_bg_with_users",
    data: {
      company,
      base_group,
      userids,
    },
  });
  return json;
};

export const unshareBgWithUsers = async (
  url: string,
  token: string,
  company: number,
  base_group: number,
  userids: number[],
) => {
  const json = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "assignments/unshare_bg_with_users",
    data: {
      company,
      base_group,
      userids,
    },
  });
  return json;
};
